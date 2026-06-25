import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prismadb from "@/lib/prismadb"
import { verifyConversationMembership } from "@/lib/conversationAuth"
import { rateLimit } from "@/lib/rateLimit"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!(await rateLimit(`summarize:${session.user.id}`, 5, 60_000))) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before summarizing again." },
        { status: 429 }
      )
    }

    const { conversationId } = await params

    const membership = await verifyConversationMembership(
      session.user.id,
      conversationId
    )
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const rawMessages = await prismadb.message.findMany({
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
      take: 50,
    })

    const recentMessages = rawMessages.reverse()

    if (recentMessages.length === 0) {
      return NextResponse.json({
        summary: "No messages to summarize yet.",
        messageCount: 0,
      })
    }

    const messagesText = recentMessages
      .map(
        (msg, i) =>
          `${i + 1}. ${msg.sender.name ?? "Unknown"}: ${msg.body ?? ""}`
      )
      .join("\n")

    const systemPrompt =
      "You're a helpful assistant summarizing recent messages in a conversation. " +
      "Write a short, friendly summary in 3-6 sentences — like you're catching up a friend on what they missed. " +
      "Cover the main topics, any decisions made, questions asked, and things people need to follow up on. " +
      "Keep it natural and easy to read, not bullet points or formal language."

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

      if (!summary) {
        return NextResponse.json(
          { error: "Summary could not be generated" },
          { status: 502 }
        )
      }

      return NextResponse.json({
        summary,
        messageCount: recentMessages.length,
      })
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      return NextResponse.json(
        { error: "Summary request timed out. Try again." },
        { status: 504 }
      )
    }
    console.error("Summarize error:", error)
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    )
  }
}
