import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prismadb from "@/lib/prismadb"

async function checkMongo() {
  try {
    await prismadb.$connect()
    const count = await prismadb.user.count()
    return { ok: true, users: count }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return { ok: false, error: msg }
  }
}

function checkPusher() {
  const keys = {
    appKey: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    appId: process.env.PUSHER_APP_ID,
    secret: process.env.PUSHER_SECRET,
  }
  const missing = Object.entries(keys)
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (missing.length > 0) {
    return { ok: false, error: "Missing: " + missing.join(", ") }
  }

  return { ok: true }
}

async function checkCloudinary() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !preset) {
    const missing = []
    if (!cloudName) missing.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME")
    if (!preset) missing.push("CLOUDINARY_UPLOAD_PRESET")
    return { ok: false, error: "Missing: " + missing.join(", ") }
  }

  return { ok: true }
}

function checkAuth() {
  const secret = process.env.NEXTAUTH_SECRET
  const url = process.env.NEXTAUTH_URL
  if (!secret || !url) {
    const missing = []
    if (!secret) missing.push("NEXTAUTH_SECRET")
    if (!url) missing.push("NEXTAUTH_URL")
    return { ok: false, error: "Missing: " + missing.join(", ") }
  }
  return { ok: true }
}

function checkGoogle() {
  const id = process.env.GOOGLE_CLIENT_ID
  const secret = process.env.GOOGLE_CLIENT_SECRET
  if (!id || !secret) {
    const missing = []
    if (!id) missing.push("GOOGLE_CLIENT_ID")
    if (!secret) missing.push("GOOGLE_CLIENT_SECRET")
    return { ok: false, error: "Missing: " + missing.join(", ") }
  }
  return { ok: true }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [mongo, pusher, cloudinary, authResult, google] = await Promise.all([
    checkMongo(),
    checkPusher(),
    checkCloudinary(),
    checkAuth(),
    checkGoogle(),
  ])

  return NextResponse.json({
    mongo,
    pusher,
    cloudinary,
    auth: authResult,
    google,
  })
}
