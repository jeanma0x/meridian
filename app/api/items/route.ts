import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { Priority, ItemStatus } from '@/lib/generated/prisma/client'
import { generateCustomId } from '@/lib/utils'

async function markOverdueItems(userId: string) {
  await db.item.updateMany({
    where: {
      organization: { userId },
      status: { notIn: [ItemStatus.DONE, ItemStatus.OVERDUE] },
      dueDate: { lt: new Date() },
    },
    data: { status: ItemStatus.OVERDUE },
  })
}

export async function GET(req: Request) {
  const user = await requireUser()
  const { searchParams } = new URL(req.url)

  const orgId    = searchParams.get('orgId')    ?? undefined
  const status   = searchParams.get('status')   ?? undefined
  const priority = searchParams.get('priority') ?? undefined

  // Mark any past-due items before returning results
  await markOverdueItems(user.id)

  // When filtering by org, verify it belongs to the user
  if (orgId) {
    const org = await db.organization.findFirst({ where: { id: orgId, userId: user.id } })
    if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })
  }

  const items = await db.item.findMany({
    where: {
      organization: { userId: user.id },
      ...(orgId    && { orgId }),
      ...(status   && Object.values(ItemStatus).includes(status as ItemStatus)   && { status:   status   as ItemStatus }),
      ...(priority && Object.values(Priority).includes(priority as Priority)     && { priority: priority as Priority }),
    },
    include: {
      organization: true,
      tags: { include: { tag: true } },
      commitments: true,
    },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  })

  return Response.json(items)
}

export async function POST(req: Request) {
  const user = await requireUser()
  const body = await req.json()

  const { title, description, orgId, priority, status, dueDate, externalId, externalSystem, tags } = body

  if (!title?.trim()) return Response.json({ error: 'title is required' }, { status: 400 })
  if (!orgId)         return Response.json({ error: 'orgId is required' }, { status: 400 })

  const org = await db.organization.findFirst({ where: { id: orgId, userId: user.id } })
  if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

  const count = await db.item.count({ where: { orgId } })
  const customId = generateCustomId(org.slug, count + 1)

  const item = await db.item.create({
    data: {
      title: title.trim(),
      description: description?.trim() ?? null,
      orgId,
      customId,
      priority: Object.values(Priority).includes(priority) ? priority : Priority.MEDIUM,
      status:   Object.values(ItemStatus).includes(status) ? status   : ItemStatus.TODO,
      dueDate:  dueDate ? new Date(dueDate) : null,
      externalId:     externalId     ?? null,
      externalSystem: externalSystem ?? null,
      ...(tags?.length && {
        tags: {
          create: tags.map((name: string) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      }),
    },
    include: {
      organization: true,
      tags: { include: { tag: true } },
      commitments: true,
    },
  })

  return Response.json(item, { status: 201 })
}
