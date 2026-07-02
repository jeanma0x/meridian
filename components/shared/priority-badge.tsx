import { Badge } from '@/components/ui/badge'
import type { Priority } from '@/lib/generated/prisma/client'

const STYLES: Record<Priority, string> = {
  URGENT: 'bg-destructive/15 text-destructive border-destructive/30',
  HIGH:   'bg-orange-500/15 text-orange-500 border-orange-500/30',
  MEDIUM: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  LOW:    'bg-muted text-muted-foreground border-transparent',
}

const LABELS: Record<Priority, string> = {
  URGENT: 'Urgente',
  HIGH:   'Alto',
  MEDIUM: 'Medio',
  LOW:    'Bajo',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={STYLES[priority]}>
      {LABELS[priority]}
    </Badge>
  )
}
