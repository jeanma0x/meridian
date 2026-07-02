import { ItemCard } from './item-card'
import { EmptyState } from '@/components/shared/empty-state'
import type { ItemWithOrg } from '@/types'

interface ItemListProps {
  items: ItemWithOrg[]
  onRefresh?: () => void
}

function isThisWeek(date: Date | null): boolean {
  if (!date) return false
  const now = new Date()
  const weekOut = new Date(now)
  weekOut.setDate(now.getDate() + 7)
  return date >= now && date <= weekOut
}

function groupItems(items: ItemWithOrg[]) {
  const urgent: ItemWithOrg[] = []
  const thisWeek: ItemWithOrg[] = []
  const backlog: ItemWithOrg[] = []

  for (const item of items) {
    if (item.status === 'DONE') continue

    const isUrgentOrBlocked =
      item.status === 'BLOCKED' ||
      item.status === 'OVERDUE' ||
      item.priority === 'URGENT'

    if (isUrgentOrBlocked) {
      urgent.push(item)
    } else if (isThisWeek(item.dueDate)) {
      thisWeek.push(item)
    } else {
      backlog.push(item)
    }
  }

  return { urgent, thisWeek, backlog }
}

function Group({
  title,
  items,
  onRefresh,
}: {
  title: string
  items: ItemWithOrg[]
  onRefresh?: () => void
}) {
  if (items.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none">
          {items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <ItemCard key={item.id} item={item} onRefresh={onRefresh} />
        ))}
      </div>
    </section>
  )
}

export function ItemList({ items, onRefresh }: ItemListProps) {
  const { urgent, thisWeek, backlog } = groupItems(items)
  const allEmpty = urgent.length === 0 && thisWeek.length === 0 && backlog.length === 0

  if (allEmpty) {
    return (
      <EmptyState
        title="Sin items"
        description="Agregá un item para empezar a trackear tu trabajo."
      />
    )
  }

  return (
    <div className="space-y-6">
      <Group title="Urgente / Bloqueado" items={urgent} onRefresh={onRefresh} />
      <Group title="Esta semana"          items={thisWeek} onRefresh={onRefresh} />
      <Group title="Backlog"              items={backlog} onRefresh={onRefresh} />
    </div>
  )
}
