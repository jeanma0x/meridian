import { Badge } from '@/components/ui/badge'
import type { ItemStatus } from '@/lib/generated/prisma/client'

const STYLES: Record<ItemStatus, string> = {
  BLOCKED:     'bg-destructive/15 text-destructive border-destructive/30',
  OVERDUE:     'bg-destructive/15 text-destructive border-destructive/30',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  TODO:        'bg-muted text-muted-foreground border-transparent',
  PENDING:     'bg-muted text-muted-foreground border-transparent',
  DONE:        'bg-green-500/15 text-green-600 border-green-500/30',
}

const LABELS: Record<ItemStatus, string> = {
  BLOCKED:     'Bloqueado',
  OVERDUE:     'Vencido',
  IN_PROGRESS: 'En curso',
  TODO:        'Por hacer',
  PENDING:     'Pendiente',
  DONE:        'Listo',
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <Badge variant="outline" className={STYLES[status]}>
      {LABELS[status]}
    </Badge>
  )
}
