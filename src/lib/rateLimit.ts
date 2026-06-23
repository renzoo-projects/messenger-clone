import prismadb from "@/lib/prismadb"

const memoryStore = new Map<string, { count: number; resetAt: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryStore) {
    if (now > entry.resetAt) memoryStore.delete(key)
  }
}, 60_000)

export async function rateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  const now = Date.now()

  try {
    const record = await prismadb.rateLimit.findUnique({ where: { key } })

    if (!record || now > record.resetAt.getTime()) {
      await prismadb.rateLimit.upsert({
        where: { key },
        update: { count: 1, resetAt: new Date(now + windowMs) },
        create: { key, count: 1, resetAt: new Date(now + windowMs) },
      })
      return true
    }

    if (record.count >= maxRequests) return false

    await prismadb.rateLimit.update({
      where: { key },
      data: { count: record.count + 1 },
    })
    return true
  } catch {
    const entry = memoryStore.get(key)
    if (!entry || now > entry.resetAt) {
      memoryStore.set(key, { count: 1, resetAt: now + windowMs })
      return true
    }
    if (entry.count >= maxRequests) return false
    entry.count++
    return true
  }
}
