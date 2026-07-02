import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const stakeholder = await db.stakeholder.findFirst({
    where: { id, organization: { userId: user.id } },
    include: { organization: true },
  })

  if (!stakeholder) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(stakeholder)
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const existing = await db.stakeholder.findFirst({
    where: { id, organization: { userId: user.id } },
  })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, role, email, formalityLevel, language, communicationStyle } = body

  const updated = await db.stakeholder.update({
    where: { id },
    data: {
      ...(name               !== undefined && { name: name.trim() }),
      ...(role               !== undefined && { role: role?.trim() ?? null }),
      ...(email              !== undefined && { email: email?.trim() ?? null }),
      ...(formalityLevel     !== undefined && { formalityLevel: Math.min(100, Math.max(0, formalityLevel)) }),
      ...(language           !== undefined && { language }),
      ...(communicationStyle !== undefined && { communicationStyle: Array.isArray(communicationStyle) ? communicationStyle.filter(Boolean) : [] }),
    },
    include: { organization: true },
  })

  return Response.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const stakeholder = await db.stakeholder.findFirst({
    where: { id, organization: { userId: user.id } },
  })
  if (!stakeholder) return Response.json({ error: 'Not found' }, { status: 404 })

  await db.stakeholder.delete({ where: { id } })

  return new Response(null, { status: 204 })
}
