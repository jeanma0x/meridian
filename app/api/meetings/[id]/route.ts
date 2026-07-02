import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

const MEETING_INCLUDE = {
  organization: true,
  stakeholders: { include: { stakeholder: true } },
} as const

export async function GET(_req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const meeting = await db.meeting.findFirst({
    where: { id, organization: { userId: user.id } },
    include: MEETING_INCLUDE,
  })
  if (!meeting) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(meeting)
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const meeting = await db.meeting.findFirst({ where: { id, organization: { userId: user.id } } })
  if (!meeting) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { title, scheduledAt, notes, prepBrief, stakeholderIds } = body

  const updated = await db.meeting.update({
    where: { id },
    data: {
      ...(title       !== undefined && { title: title.trim() }),
      ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
      ...(notes       !== undefined && { notes: notes?.trim() || null }),
      ...(prepBrief   !== undefined && { prepBrief }),
    },
    include: MEETING_INCLUDE,
  })

  if (Array.isArray(stakeholderIds)) {
    await db.meetingStakeholder.deleteMany({ where: { meetingId: id } })
    if (stakeholderIds.length > 0) {
      await db.meetingStakeholder.createMany({
        data: stakeholderIds.map((sid: string) => ({ meetingId: id, stakeholderId: sid })),
        skipDuplicates: true,
      })
    }
    const withStakeholders = await db.meeting.findUnique({ where: { id }, include: MEETING_INCLUDE })
    return Response.json(withStakeholders)
  }

  return Response.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const meeting = await db.meeting.findFirst({ where: { id, organization: { userId: user.id } } })
  if (!meeting) return Response.json({ error: 'Not found' }, { status: 404 })

  await db.meeting.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
