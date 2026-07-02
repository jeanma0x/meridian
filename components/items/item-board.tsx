import { ItemCard } from './item-card'
import { EmptyState } from '@/components/shared/empty-state'
import type { ItemWithOrg } from '@/types'
import type { ItemStatus } from '@/lib/generated/prisma/client'

interface ItemBoardProps {
  items: ItemWithOrg[]
  onRefresh?: () => void
}

const COLUMNS: { title: string; statuses: ItemStatus[]; accent: string }[] = [
  {
    title:    'Bloqueado',
    statuses: ['BLOCKED', 'OVERDUE'],
    accent:   'bg-destructive/10 border-destructive/20',
  },
  {
    title:    'En curso',
    statuses: ['IN_PROGRESS'],
    accent:   'bg-blue-500/10 border-blue-500/20',
  },
  {
    title:    'Pendiente',
    statuses: ['TODO', 'PENDING'],
    accent:   'bg-muted/50 border-border',
  },
]

export function ItemBoard({ items, onRefresh }: ItemBoardProps) {
  const active = items.filter(i => i.status !== 'DONE')

  if (active.length === 0) {
    return (
      <EmptyState
        title="Sin items activos"
        description="Los items completados no aparecen en el board."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      {COLUMNS.map(({ title, statuses, accent }) => {
        const col = active.filter(i => statuses.includes(i.status))

        return (
          <div key={title} className={`rounded-lg border p-3 ${accent}`}>
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
              </h3>
              <span className="text-xs text-muted-foreground bg-background/60 rounded-full px-1.5 py-0.5 leading-none">
                {col.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {col.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Sin items</p>
              ) : (
                col.map(item => (
                  <ItemCard key={item.id} item={item} onRefresh={onRefresh} compact />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
