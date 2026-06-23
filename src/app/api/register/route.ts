import bcrypt from "bcryptjs"
import prismadb from "@/lib/prismadb"
import { NextResponse } from "next/server"
import { registerSchema } from "@/lib/validations"
import { sanitizeUser } from "@/lib/safeUser"
import { rateLimit } from "@/lib/rateLimit"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown"
    if (!(await rateLimit(`register:${ip}`, 5, 60_000))) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      console.error("REGISTER_VALIDATION_ERROR", parsed.error.issues)
      return NextResponse.json(
        { error: "Registration failed" },
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
        { error: "Registration failed" },
        { status: 400 }
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
