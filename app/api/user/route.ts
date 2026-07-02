import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await requireUser()
  return Response.json({ id: user.id, name: user.name, email: user.email })
}

export async function PATCH(req: Request) {
  const user = await requireUser()
  const { name } = await req.json()
  if (typeof name !== 'string' || !name.trim()) {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }
  const updated = await db.user.update({
    where: { id: user.id },
    data: { name: name.trim() },
  })
  return Response.json({ id: updated.id, name: updated.name, email: updated.email })
}
