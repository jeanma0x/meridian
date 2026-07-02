import { Badge } from '@/components/ui/badge'
import type { CommitmentStatus } from '@/lib/generated/prisma/client'

const STYLES: Record<CommitmentStatus, string> = {
  PENDING:   'bg-muted text-muted-foreground border-transparent',
  AT_RISK:   'bg-amber-500/15 text-amber-600 border-amber-500/30',
  OVERDUE:   'bg-destructive/15 text-destructive border-destructive/30',
  FULFILLED: 'bg-green-500/15 text-green-600 border-green-500/30',
}

const LABELS: Record<CommitmentStatus, string> = {
  PENDING:   'Pendiente',
  AT_RISK:   'En riesgo',
  OVERDUE:   'Vencido',
  FULFILLED: 'Cumplido',
}

export function CommitmentStatusBadge({ status }: { status: CommitmentStatus }) {
  return (
    <Badge variant="outline" className={STYLES[status]}>
      {LABELS[status]}
    </Badge>
  )
}
