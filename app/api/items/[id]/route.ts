import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { Priority, ItemStatus } from '@/lib/generated/prisma/client'

type Params = { params: Promise<{ id: string }> }

const ITEM_INCLUDE = {
  organization: true,
  tags: { include: { tag: true } },
  commitments: true,
} as const

export async function GET(_req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const item = await db.item.findFirst({
    where: { id, organization: { userId: user.id } },
    include: ITEM_INCLUDE,
  })

  if (!item) return Response.json({ error: 'Not found' }, { status: 404 })

  // Inline OVERDUE check for single-item fetch
  if (
    item.dueDate &&
    item.dueDate < new Date() &&
    item.status !== ItemStatus.DONE &&
    item.status !== ItemStatus.OVERDUE
  ) {
    const updated = await db.item.update({
      where: { id },
      data: { status: ItemStatus.OVERDUE },
      include: ITEM_INCLUDE,
    })
    return Response.json(updated)
  }

  return Response.json(item)
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const item = await db.item.findFirst({
    where: { id, organization: { userId: user.id } },
  })
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { title, description, priority, status, dueDate, externalId, externalSystem, tags } = body

  const updated = await db.item.update({
    where: { id },
    data: {
      ...(title       !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() ?? null }),
      ...(priority    !== undefined && Object.values(Priority).includes(priority)   && { priority }),
      ...(status      !== undefined && Object.values(ItemStatus).includes(status)   && { status }),
      ...(dueDate     !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(externalId     !== undefined && { externalId }),
      ...(externalSystem !== undefined && { externalSystem }),
      lastActivityAt: new Date(),
      ...(tags !== undefined && {
        tags: {
          deleteMany: {},
          create: tags.map((name: string) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      }),
    },
    include: ITEM_INCLUDE,
  })

  return Response.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const item = await db.item.findFirst({
    where: { id, organization: { userId: user.id } },
  })
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 })

  await db.item.delete({ where: { id } })

  return new Response(null, { status: 204 })
}
