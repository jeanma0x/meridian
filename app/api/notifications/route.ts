import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await requireUser()

  const notifications = await db.notification.findMany({
    where:   { userId: user.id },
    include: { item: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
    take:    50,
  })

  return Response.json(notifications)
}

export async function PATCH() {
  const user = await requireUser()

  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data:  { read: true },
  })

  return Response.json({ ok: true })
}
