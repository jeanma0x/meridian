import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(_req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const notification = await db.notification.findFirst({
    where: { id, userId: user.id },
  })
  if (!notification) return Response.json({ error: 'Not found' }, { status: 404 })

  const updated = await db.notification.update({
    where: { id },
    data:  { read: true },
  })

  return Response.json(updated)
}
