import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { CommitmentStatus } from '@/lib/generated/prisma/client'

export async function GET(req: Request) {
  const user = await requireUser()
  const { searchParams } = new URL(req.url)

  const orgId         = searchParams.get('orgId')         ?? undefined
  const stakeholderId = searchParams.get('stakeholderId') ?? undefined
  const status        = searchParams.get('status')        ?? undefined
  const direction     = searchParams.get('direction')     ?? undefined
  const itemId        = searchParams.get('itemId')        ?? undefined

  const commitments = await db.commitment.findMany({
    where: {
      stakeholder: { organization: { userId: user.id } },
      ...(orgId         && { stakeholder: { orgId } }),
      ...(stakeholderId && { stakeholderId }),
      ...(itemId        && { itemId }),
      ...(status        && Object.values(CommitmentStatus).includes(status as CommitmentStatus) && { status: status as CommitmentStatus }),
      ...(direction     && { direction }),
    },
    include: {
      stakeholder: { include: { organization: true } },
      item: true,
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  })

  return Response.json(commitments)
}

export async function POST(req: Request) {
  const user = await requireUser()
  const body = await req.json()

  const { title, description, direction, dueDate, status, notes, itemId, stakeholderId } = body

  if (!title?.trim())  return Response.json({ error: 'title is required' },       { status: 400 })
  if (!stakeholderId)  return Response.json({ error: 'stakeholderId is required' }, { status: 400 })

  const stakeholder = await db.stakeholder.findFirst({
    where: { id: stakeholderId, organization: { userId: user.id } },
  })
  if (!stakeholder) return Response.json({ error: 'Stakeholder not found' }, { status: 404 })

  if (itemId) {
    const item = await db.item.findFirst({ where: { id: itemId, organization: { userId: user.id } } })
    if (!item) return Response.json({ error: 'Item not found' }, { status: 404 })
  }

  const commitment = await db.commitment.create({
    data: {
      title:         title.trim(),
      description:   description?.trim() ?? null,
      direction:     direction ?? 'outbound',
      dueDate:       dueDate ? new Date(dueDate) : null,
      status:        Object.values(CommitmentStatus).includes(status) ? status : CommitmentStatus.PENDING,
      notes:         notes?.trim() ?? null,
      stakeholderId,
      itemId:        itemId ?? null,
    },
    include: {
      stakeholder: { include: { organization: true } },
      item: true,
    },
  })

  // Update stakeholder lastContactAt
  await db.stakeholder.update({
    where: { id: stakeholderId },
    data:  { lastContactAt: new Date() },
  })

  return Response.json(commitment, { status: 201 })
}
