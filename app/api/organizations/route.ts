import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { OrgSystem } from '@/lib/generated/prisma/client'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 32)
}

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const organizations = await db.organization.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  })

  return Response.json(organizations)
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json()
  const { name, color, system, systemUrl } = body

  if (!name?.trim()) {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }

  const slug = body.slug?.trim() || slugify(name)

  const validSystem = Object.values(OrgSystem).includes(system) ? system : OrgSystem.OTHER

  const existing = await db.organization.findUnique({
    where: { userId_slug: { userId: user.id, slug } },
  })
  if (existing) {
    return Response.json({ error: 'An organization with this slug already exists' }, { status: 409 })
  }

  const org = await db.organization.create({
    data: {
      name: name.trim(),
      slug,
      color: color || '#185FA5',
      system: validSystem,
      systemUrl: systemUrl || null,
      userId: user.id,
    },
  })

  return Response.json(org, { status: 201 })
}
