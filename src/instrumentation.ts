export async function register() {
  if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "production") return

  console.log("\n⚡ Messenger Clone starting...")
  console.log("─────────────────────────────")

  function check(label: string, keys: Record<string, string | undefined>, total: number) {
    const missing = Object.entries(keys).filter(([, v]) => !v).map(([k]) => k)
    const present = total - missing.length
    if (missing.length === 0) {
      console.log(`  ✓ ${label}: ${total}/${total} keys present`)
      return true
    }
    console.log(`  ✗ ${label}: ${present}/${total} keys present (missing: ${missing.join(", ")})`)
    return false
  }

  function checkBool(label: string, ok: boolean) {
    console.log(`  ${ok ? "✓" : "✗"} ${label}: ${ok ? "configured" : "missing"}`)
    return ok
  }

  const results = [
    check("MongoDB", { DATABASE_URL: process.env.DATABASE_URL }, 1),
    check("Pusher", {
      NEXT_PUBLIC_PUSHER_APP_KEY: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
      NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      PUSHER_APP_ID: process.env.PUSHER_APP_ID,
      PUSHER_SECRET: process.env.PUSHER_SECRET,
    }, 4),
    check("Cloudinary", {
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
    }, 2),
    checkBool("Auth", !!(process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL)),
    checkBool("Google OAuth", !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)),
    checkBool("Groq AI", !!process.env.GROQ_API_KEY),
  ]

  console.log("─────────────────────────────")
  const allOk = results.every(Boolean)

  if (allOk) {
    console.log("✅ All systems nominal\n")
  } else {
    console.log("⚠️  Some services need attention — hit /api/health for detailed diagnostics\n")
  }
}
