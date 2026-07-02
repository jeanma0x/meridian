import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { callAI, PROMPTS } from '@/lib/ai'
import { ItemStatus } from '@/lib/generated/prisma/client'
import type { FocusItem } from '@/types'

export async function GET() {
  try {
    const user = await requireUser()

    const items = await db.item.findMany({
      where: {
        organization: { userId: user.id },
        status: { not: ItemStatus.DONE },
      },
      include: {
        organization: true,
        commitments: true,
        tags: { include: { tag: true } },
      },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    })

    if (items.length === 0) return Response.json([])

    const now = new Date()

    const context = items.map(item => ({
      id:              item.id,
      title:           item.title,
      org:             item.organization.name,
      priority:        item.priority,
      status:          item.status,
      dueDate:         item.dueDate?.toISOString().split('T')[0] ?? null,
      overdueCommitments: item.commitments.filter(
        c => c.dueDate && c.dueDate < now && c.status !== 'FULFILLED'
      ).length,
    }))

    const raw    = await callAI(PROMPTS.focus, JSON.stringify(context))
    const parsed = JSON.parse(raw) as { focus: Array<{ id: string; reason: string }> }

    const focusIds = parsed.focus ?? []

    const itemMap = new Map(items.map(i => [i.id, i]))

    const result: FocusItem[] = focusIds
      .map(f => {
        const item = itemMap.get(f.id)
        if (!item) return null
        return { id: f.id, reason: f.reason, item } as FocusItem
      })
      .filter((f): f is FocusItem => f !== null)
      .slice(0, 5)

    return Response.json(result)
  } catch (e) {
    console.error('Focus error:', e)
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
