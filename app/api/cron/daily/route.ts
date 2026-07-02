import { db } from '@/lib/db'
import { ItemStatus, CommitmentStatus, NotificationType } from '@/lib/generated/prisma/client'

export const runtime = 'nodejs'

// Returns true if a notification of the given type for the given item already
// exists in the last 24 hours, to prevent duplicates on re-runs.
async function recentNotificationExists(
  userId: string,
  type: NotificationType,
  itemId?: string,
): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const count = await db.notification.count({
    where: {
      userId,
      type,
      createdAt: { gte: since },
      ...(itemId ? { itemId } : {}),
    },
  })
  return count > 0
}

export async function GET(req: Request) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now        = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const stats = { overdue: 0, commitmentDue: 0, deadZone: 0 }

  // ── a) Overdue items ───────────────────────────────────────────────────────
  const overdueItems = await db.item.findMany({
    where: {
      dueDate: { lt: now },
      status:  { notIn: [ItemStatus.DONE, ItemStatus.OVERDUE] },
    },
    include: { organization: { select: { userId: true } } },
  })

  for (const item of overdueItems) {
    // Mark item OVERDUE
    await db.item.update({
      where: { id: item.id },
      data:  { status: ItemStatus.OVERDUE },
    })

    const userId = item.organization.userId
    if (!(await recentNotificationExists(userId, NotificationType.OVERDUE, item.id))) {
      await db.notification.create({
        data: {
          userId,
          type:    NotificationType.OVERDUE,
          message: `El item "${item.title}" está vencido.`,
          itemId:  item.id,
        },
      })
      stats.overdue++
    }
  }

  // ── b) Commitments due ────────────────────────────────────────────────────
  const dueCommitments = await db.commitment.findMany({
    where: {
      dueDate: { lt: now },
      status:  CommitmentStatus.PENDING,
    },
    include: {
      stakeholder: { include: { organization: { select: { userId: true } } } },
    },
  })

  for (const c of dueCommitments) {
    const userId = c.stakeholder.organization.userId
    if (!(await recentNotificationExists(userId, NotificationType.COMMITMENT_DUE, c.itemId ?? undefined))) {
      await db.notification.create({
        data: {
          userId,
          type:    NotificationType.COMMITMENT_DUE,
          message: `El commitment "${c.title}" con ${c.stakeholder.name} está vencido.`,
          itemId:  c.itemId ?? null,
        },
      })
      stats.commitmentDue++
    }
  }

  // ── c) Dead zone items ────────────────────────────────────────────────────
  const deadZoneItems = await db.item.findMany({
    where: {
      lastActivityAt: { lt: sevenDaysAgo },
      status:         { in: [ItemStatus.TODO, ItemStatus.PENDING, ItemStatus.IN_PROGRESS] },
    },
    include: { organization: { select: { userId: true } } },
  })

  for (const item of deadZoneItems) {
    const userId = item.organization.userId
    if (!(await recentNotificationExists(userId, NotificationType.DEAD_ZONE, item.id))) {
      await db.notification.create({
        data: {
          userId,
          type:    NotificationType.DEAD_ZONE,
          message: `"${item.title}" lleva más de 7 días sin actividad.`,
          itemId:  item.id,
        },
      })
      stats.deadZone++
    }
  }

  return Response.json({
    ok: true,
    created: stats,
    ranAt: now.toISOString(),
  })
}
