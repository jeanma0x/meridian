import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import type { User } from '@/lib/generated/prisma/client'

export async function getCurrentUser(): Promise<User | null> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  return db.user.findUnique({ where: { clerkId } })
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}
