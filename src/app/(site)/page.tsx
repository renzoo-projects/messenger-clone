import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AuthForm from "./AuthForm"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/conversations")
  }

  const showGoogleOAuth = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  return <AuthForm showGoogleOAuth={showGoogleOAuth} />
}
