import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
})

export const conversationSchema = z.object({
  userId: z.string().optional(),
  isGroup: z.boolean().optional(),
  members: z.array(z.string()).optional(),
  name: z.string().optional(),
})

export const conversationPatchSchema = z.object({
  name: z.string().min(1).max(100),
})

export const messageSchema = z.object({
  message: z.string().max(5000).optional(),
  image: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
}).refine((data) => data.message || data.image || (data.images && data.images.length > 0), { message: "Message or image required" })

export const addMemberSchema = z.object({
  userId: z.string().min(1).max(100),
})

export const removeMemberSchema = z.object({
  userId: z.string().min(1).max(100),
})

export const settingsSchema = z.object({
  name: z.string().min(1).max(100),
  image: z.string().url().optional().nullable(),
})

