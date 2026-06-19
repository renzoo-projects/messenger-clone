import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prismadb from "@/lib/prismadb"
import { sanitizeUser } from "@/lib/safeUser"
import { settingsSchema } from "@/lib/validations"

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) {
      console.error("SETTINGS_VALIDATION_ERROR", parsed.error.issues)
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    const { name, image } = parsed.data

    const user = await prismadb.user.update({
      where: { id: session.user.id },
      data: { name, image },
    })

    return NextResponse.json(sanitizeUser(user))
  } catch (error) {
    console.error("SETTINGS_PATCH", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
