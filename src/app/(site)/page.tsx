import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AuthForm from "./AuthForm"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/conversations")
  }

  return <AuthForm />
}
