import { User } from "@prisma/client"
import { SafeUser } from "@/types"

function toISO(d: Date | string | null | undefined): string | null {
  if (!d) return null
  return typeof d === "string" ? d : d.toISOString()
}

export function sanitizeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: toISO(user.emailVerified),
    image: user.image,
    createdAt: toISO(user.createdAt)!,
    updatedAt: toISO(user.updatedAt)!,
  }
}
