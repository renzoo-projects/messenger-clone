import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prismadb from "@/lib/prismadb"

async function checkMongo() {
  try {
    await prismadb.$connect()
    const count = await prismadb.user.count()
    console.log("[Health] MongoDB: connected,", count, "users found")
    return { ok: true, users: count }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    console.log("[Health] MongoDB: failed -", msg)
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
    console.log("[Health] Pusher: missing keys -", missing.join(", "))
    return { ok: false, error: "Missing: " + missing.join(", ") }
  }

  console.log("[Health] Pusher: all keys present")
  return { ok: true }
}

async function checkCloudinary() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !preset) {
    const missing = []
    if (!cloudName) missing.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME")
    if (!preset) missing.push("CLOUDINARY_UPLOAD_PRESET")
    console.log("[Health] Cloudinary: missing keys -", missing.join(", "))
    return { ok: false, error: "Missing: " + missing.join(", ") }
  }

  console.log("[Health] Cloudinary: configured (unsigned upload)")
  return { ok: true }
}

function checkAuth() {
  const secret = process.env.NEXTAUTH_SECRET
  const url = process.env.NEXTAUTH_URL
  if (!secret || !url) {
    const missing = []
    if (!secret) missing.push("NEXTAUTH_SECRET")
    if (!url) missing.push("NEXTAUTH_URL")
    console.log("[Health] Auth: missing -", missing.join(", "))
    return { ok: false, error: "Missing: " + missing.join(", ") }
  }
  console.log("[Health] Auth: configured")
  return { ok: true }
}

function checkGoogle() {
  const id = process.env.GOOGLE_CLIENT_ID
  const secret = process.env.GOOGLE_CLIENT_SECRET
  if (!id || !secret) {
    const missing = []
    if (!id) missing.push("GOOGLE_CLIENT_ID")
    if (!secret) missing.push("GOOGLE_CLIENT_SECRET")
    console.log("[Health] Google OAuth: missing -", missing.join(", "))
    return { ok: false, error: "Missing: " + missing.join(", ") }
  }
  console.log("[Health] Google OAuth: configured")
  return { ok: true }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("\n[Health] --- Connection Diagnostics ---")

  const [mongo, pusher, cloudinary, authResult, google] = await Promise.all([
    checkMongo(),
    checkPusher(),
    checkCloudinary(),
    checkAuth(),
    checkGoogle(),
  ])

  const allOk = [mongo, pusher, cloudinary, authResult, google].every((r) => r.ok)

  console.log("[Health] --- Summary:", allOk ? "All OK" : "Issues found", "---\n")

  return NextResponse.json({
    mongo,
    pusher,
    cloudinary,
    auth: authResult,
    google,
  })
}
