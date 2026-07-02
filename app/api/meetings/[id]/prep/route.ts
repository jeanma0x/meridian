import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { callAI, PROMPTS } from '@/lib/ai'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  try {
    const user = await requireUser()
    const { id } = await params

    const meeting = await db.meeting.findFirst({
      where: { id, organization: { userId: user.id } },
      include: {
        organization: true,
        stakeholders: { include: { stakeholder: true } },
      },
    })
    if (!meeting) return Response.json({ error: 'Not found' }, { status: 404 })

    // Build context for the AI
    const stakeholderNames = meeting.stakeholders.map(s => s.stakeholder.name).join(', ') || 'Sin stakeholders'
    const context = [
      `Reunión: ${meeting.title}`,
      `Organización: ${meeting.organization.name}`,
      `Participantes: ${stakeholderNames}`,
      meeting.scheduledAt ? `Fecha: ${new Date(meeting.scheduledAt).toLocaleString('es-ES')}` : '',
      meeting.notes ? `Notas previas: ${meeting.notes}` : '',
    ].filter(Boolean).join('\n')

    const raw    = await callAI(PROMPTS.meetingPrep, context)
    const parsed = JSON.parse(raw) as { brief: { agenda: string[]; toReport: string[]; toAsk: string[]; risks: string[] } }

    // Persist brief in DB
    await db.meeting.update({ where: { id }, data: { prepBrief: raw } })

    return Response.json(parsed.brief)
  } catch (e) {
    console.error('Meeting prep error:', e)
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
