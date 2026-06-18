import bcrypt from "bcryptjs"
import prismadb from "@/lib/prismadb"
import { NextResponse } from "next/server"
import { registerSchema } from "@/lib/validations"
import { sanitizeUser } from "@/lib/safeUser"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input: " + parsed.error.issues.map(e => e.message).join(", ") },
        { status: 400 }
      )
    }

    const email = parsed.data.email.toLowerCase()
    const { name, password } = parsed.data

    const existing = await prismadb.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prismadb.user.create({
      data: {
        email,
        name,
        hashedPassword,
      },
    })

    return NextResponse.json(sanitizeUser(user), { status: 201 })
  } catch (error) {
    console.error("REGISTER_ERROR", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
