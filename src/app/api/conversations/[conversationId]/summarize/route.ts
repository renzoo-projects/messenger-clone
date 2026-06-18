import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prismadb from "@/lib/prismadb"
import { verifyConversationMembership } from "@/lib/conversationAuth"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params

    const membership = await verifyConversationMembership(
      session.user.id,
      conversationId
    )
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const recentMessages = await prismadb.message.findMany({
      where: {
        conversationId,
        body: { not: null },
      },
      select: {
        body: true,
        sender: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    if (recentMessages.length === 0) {
      return NextResponse.json({
        summary: "No messages to summarize yet.",
        messageCount: 0,
      })
    }

    const reversedMessages = recentMessages.reverse()

    const messagesText = reversedMessages
      .map(
        (msg, i) =>
          `${i + 1}. ${msg.sender.name}: ${msg.body}`
      )
      .join("\n")

    const systemPrompt =
      "Summarize the following chat messages in 1-2 concise paragraphs. " +
      "Write in natural, flowing prose that captures the key topics, decisions, " +
      "and questions discussed. " +
      "Focus on decisions, questions, tasks, and key information. " +
      "Keep it brief — 3-6 sentences total."

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          signal: controller.signal,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Summarize these ${recentMessages.length} messages:\n\n${messagesText}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 300,
          }),
        }
      )

      if (!groqResponse.ok) {
        const errorText = await groqResponse.text()
        console.error("Groq API error:", groqResponse.status, errorText)
        return NextResponse.json(
          { error: "Failed to generate summary" },
          { status: 502 }
        )
      }

      const groqData = await groqResponse.json()
      const summary = groqData.choices?.[0]?.message?.content?.trim() || ""

      return NextResponse.json({
        summary,
        messageCount: recentMessages.length,
      })
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    console.error("Summarize error:", error)
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    )
  }
}
