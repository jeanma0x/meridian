import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { OrgSystem } from '@/lib/generated/prisma/client'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const org = await db.organization.findFirst({
    where: { id, userId: user.id },
    include: {
      _count: { select: { items: true, stakeholders: true, meetings: true } },
    },
  })

  if (!org) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(org)
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const org = await db.organization.findFirst({ where: { id, userId: user.id } })
  if (!org) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, color, system, systemUrl, slug } = body

  if (slug && slug !== org.slug) {
    const conflict = await db.organization.findUnique({
      where: { userId_slug: { userId: user.id, slug } },
    })
    if (conflict) return Response.json({ error: 'Slug already in use' }, { status: 409 })
  }

  const updated = await db.organization.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(color !== undefined && { color }),
      ...(system !== undefined && {
        system: Object.values(OrgSystem).includes(system) ? system : org.system,
      }),
      ...(systemUrl !== undefined && { systemUrl }),
      ...(slug !== undefined && { slug }),
    },
  })

  return Response.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await requireUser()
  const { id } = await params

  const org = await db.organization.findFirst({
    where: { id, userId: user.id },
    include: { _count: { select: { items: true } } },
  })

  if (!org) return Response.json({ error: 'Not found' }, { status: 404 })

  if (org._count.items > 0) {
    return Response.json(
      { error: 'Cannot delete an organization that has items. Delete or move the items first.' },
      { status: 409 }
    )
  }

  await db.organization.delete({ where: { id } })

  return new Response(null, { status: 204 })
}
