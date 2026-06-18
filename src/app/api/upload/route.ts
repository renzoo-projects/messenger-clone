import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const raw = formData.get("file")
    if (!(raw instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }
    const file = raw

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    const MAX_SIZE = 10 * 1024 * 1024

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      )
    }

    const uploadFormData = new FormData()
    uploadFormData.append("file", file)
    uploadFormData.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET!)

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: uploadFormData }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error("CLOUDINARY_UPLOAD_ERROR", err)
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ url: data.secure_url || data.url })
  } catch (error) {
    console.error("UPLOAD_POST", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
