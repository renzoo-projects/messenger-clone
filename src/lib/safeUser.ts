import { User } from "@prisma/client"
import { SafeUser } from "@/types"
import { toISO } from "@/lib/dates"

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
