import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const user = await requireUser()
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId') ?? undefined

  if (orgId) {
    const org = await db.organization.findFirst({ where: { id: orgId, userId: user.id } })
    if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })
  }

  const stakeholders = await db.stakeholder.findMany({
    where: {
      organization: { userId: user.id },
      ...(orgId && { orgId }),
    },
    include: { organization: true },
    orderBy: [{ name: 'asc' }],
  })

  return Response.json(stakeholders)
}

export async function POST(req: Request) {
  const user = await requireUser()
  const body = await req.json()

  const { name, role, email, formalityLevel, language, communicationStyle, orgId } = body

  if (!name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 })
  if (!orgId)        return Response.json({ error: 'orgId is required' }, { status: 400 })

  const org = await db.organization.findFirst({ where: { id: orgId, userId: user.id } })
  if (!org) return Response.json({ error: 'Organization not found' }, { status: 404 })

  const stakeholder = await db.stakeholder.create({
    data: {
      name: name.trim(),
      role: role?.trim() ?? null,
      email: email?.trim() ?? null,
      formalityLevel: typeof formalityLevel === 'number' ? Math.min(100, Math.max(0, formalityLevel)) : 50,
      language: language ?? 'es',
      communicationStyle: Array.isArray(communicationStyle) ? communicationStyle.filter(Boolean) : [],
      orgId,
    },
    include: { organization: true },
  })

  return Response.json(stakeholder, { status: 201 })
}
