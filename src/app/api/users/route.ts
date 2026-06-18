import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import { sanitizeUser } from "@/lib/safeUser"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await prismadb.user.findMany({
      where: {
        id: { not: session.user.id },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users.map(sanitizeUser))
  } catch (error) {
    console.error("USERS_GET", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
