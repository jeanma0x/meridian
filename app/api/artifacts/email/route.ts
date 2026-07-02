import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { callAI, PROMPTS } from '@/lib/ai'

export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const body = await req.json()
    const { stakeholderId, itemId, commitmentId, context } = body

    if (!stakeholderId)  return Response.json({ error: 'stakeholderId is required' }, { status: 400 })
    if (!context?.trim()) return Response.json({ error: 'context is required' },       { status: 400 })

    const stakeholder = await db.stakeholder.findFirst({
      where: { id: stakeholderId, organization: { userId: user.id } },
      include: { organization: true },
    })
    if (!stakeholder) return Response.json({ error: 'Stakeholder not found' }, { status: 404 })

    const lang      = stakeholder.language === 'en' ? 'English' : 'español'
    const roleNote  = stakeholder.role ? `, ${stakeholder.role}` : ''

    const userContent = [
      `Idioma: ${lang}`,
      `Destinatario: ${stakeholder.name}${roleNote}`,
      `Nivel de formalidad: ${stakeholder.formalityLevel}/100`,
      `Contexto del correo: ${context.trim()}`,
      itemId       ? `Item relacionado: ${itemId}`       : '',
      commitmentId ? `Commitment: ${commitmentId}`       : '',
    ].filter(Boolean).join('\n')

    const raw    = await callAI(PROMPTS.draftEmail, userContent)
    const parsed = JSON.parse(raw) as { subject: string; body: string }

    return Response.json(parsed)
  } catch (e) {
    console.error('Email draft error:', e)
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
