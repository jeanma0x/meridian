import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import type { User } from '@/lib/generated/prisma/client'

// Finds the DB user by Clerk ID, creating it on first access if the webhook
// hasn't fired yet (e.g. local dev without an active webhook endpoint).
export async function getCurrentUser(): Promise<User | null> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const existing = await db.user.findUnique({ where: { clerkId } })
  if (existing) return existing

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  return db.user.create({
    data: {
      clerkId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      name: clerkUser.fullName ?? '',
    },
  })
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}
