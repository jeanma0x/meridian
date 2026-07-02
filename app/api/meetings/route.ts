import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

const MEETING_INCLUDE = {
  organization: true,
  stakeholders: { include: { stakeholder: true } },
} as const

export async function GET(req: Request) {
  const user = await requireUser()
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId') ?? undefined

  const meetings = await db.meeting.findMany({
    where: {
      organization: { userId: user.id },
      ...(orgId && { orgId }),
    },
    include: MEETING_INCLUDE,
    orderBy: { scheduledAt: 'desc' },
  })

  return Response.json(meetings)
}

export async function POST(req: Request) {
  const user = await requireUser()
  const body = await req.json()
  const { title, orgId, scheduledAt, notes, stakeholderIds } = body

  if (!title?.trim()) return Response.json({ error: 'title is required' }, { status: 400 })
  if (!orgId)         return Response.json({ error: 'orgId is required' },  { status: 400 })

  const org = await db.organization.findFirst({ where: { id: orgId, userId: user.id } })
  if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

  const meeting = await db.meeting.create({
    data: {
      title:       title.trim(),
      orgId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      notes:       notes?.trim() || null,
      stakeholders: {
        create: Array.isArray(stakeholderIds)
          ? stakeholderIds.map((id: string) => ({ stakeholderId: id }))
          : [],
      },
    },
    include: MEETING_INCLUDE,
  })

  return Response.json(meeting, { status: 201 })
}
