import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { CommitmentStatus } from '@/lib/generated/prisma/client'

type Params = { params: Promise<{ id: string }> }

const COMMITMENT_INCLUDE = {
  stakeholder: { include: { organization: true } },
  item: true,
} as const

export async function GET(_req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const commitment = await db.commitment.findFirst({
    where: { id, stakeholder: { organization: { userId: user.id } } },
    include: COMMITMENT_INCLUDE,
  })

  if (!commitment) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(commitment)
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const existing = await db.commitment.findFirst({
    where: { id, stakeholder: { organization: { userId: user.id } } },
  })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { title, description, direction, dueDate, status, notes, itemId } = body

  if (itemId !== undefined && itemId !== null) {
    const item = await db.item.findFirst({ where: { id: itemId, organization: { userId: user.id } } })
    if (!item) return Response.json({ error: 'Item not found' }, { status: 404 })
  }

  const updated = await db.commitment.update({
    where: { id },
    data: {
      ...(title       !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() ?? null }),
      ...(direction   !== undefined && { direction }),
      ...(dueDate     !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(status      !== undefined && Object.values(CommitmentStatus).includes(status) && { status }),
      ...(notes       !== undefined && { notes: notes?.trim() ?? null }),
      ...(itemId      !== undefined && { itemId: itemId ?? null }),
    },
    include: COMMITMENT_INCLUDE,
  })

  return Response.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const commitment = await db.commitment.findFirst({
    where: { id, stakeholder: { organization: { userId: user.id } } },
  })
  if (!commitment) return Response.json({ error: 'Not found' }, { status: 404 })

  await db.commitment.delete({ where: { id } })

  return new Response(null, { status: 204 })
}
