'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { CommitmentCard } from '@/components/commitments/commitment-card'
import { CommitmentForm } from '@/components/commitments/commitment-form'
import type { CommitmentWithStakeholder } from '@/types'
import type { CommitmentStatus } from '@/lib/generated/prisma/client'

// Order for status groups within each direction section
const STATUS_ORDER: CommitmentStatus[] = ['OVERDUE', 'AT_RISK', 'PENDING', 'FULFILLED']

const STATUS_LABELS: Record<CommitmentStatus, string> = {
  OVERDUE:   'Vencidos',
  AT_RISK:   'En riesgo',
  PENDING:   'Pendientes',
  FULFILLED: 'Cumplidos',
}

function CommitmentsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
      ))}
    </div>
  )
}

function StatusGroup({
  status,
  items,
  onEdit,
  onRefresh,
}: {
  status: CommitmentStatus
  items: CommitmentWithStakeholder[]
  onEdit: (c: CommitmentWithStakeholder) => void
  onRefresh: () => void
}) {
  const [open, setOpen] = useState(status !== 'FULFILLED')

  if (items.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 mb-2 cursor-pointer group"
      >
        {open
          ? <ChevronDown  className="w-3.5 h-3.5 text-muted-foreground" />
          : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        }
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none">
          {items.length}
        </span>
      </button>

      {open && (
        <div className="space-y-2 mb-4">
          {items.map(c => (
            <CommitmentCard key={c.id} commitment={c} onEdit={onEdit} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  )
}

function DirectionSection({
  title,
  accent,
  commitments,
  onEdit,
  onRefresh,
}: {
  title: string
  accent: string
  commitments: CommitmentWithStakeholder[]
  onEdit: (c: CommitmentWithStakeholder) => void
  onRefresh: () => void
}) {
  if (commitments.length === 0) return null

  const grouped = STATUS_ORDER.reduce<Record<CommitmentStatus, CommitmentWithStakeholder[]>>(
    (acc, s) => {
      acc[s] = commitments.filter(c => c.status === s)
      return acc
    },
    { OVERDUE: [], AT_RISK: [], PENDING: [], FULFILLED: [] }
  )

  return (
    <section>
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${accent}`}>
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 leading-none">
          {commitments.length}
        </span>
      </div>

      {STATUS_ORDER.map(s => (
        <StatusGroup
          key={s}
          status={s}
          items={grouped[s]}
          onEdit={onEdit}
          onRefresh={onRefresh}
        />
      ))}
    </section>
  )
}

function CommitmentsContent() {
  const searchParams = useSearchParams()
  const orgSlug = searchParams.get('org') ?? undefined

  const [commitments, setCommitments] = useState<CommitmentWithStakeholder[]>([])
  const [loading,     setLoading]     = useState(true)
  const [sheetOpen,   setSheetOpen]   = useState(false)
  const [editing,     setEditing]     = useState<CommitmentWithStakeholder | null>(null)

  const fetchCommitments = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/commitments')
      const data = await res.json()
      if (!Array.isArray(data)) return

      const filtered = orgSlug
        ? data.filter((c: CommitmentWithStakeholder) => c.stakeholder.organization.slug === orgSlug)
        : data

      setCommitments(filtered)
    } catch {
      setCommitments([])
    } finally {
      setLoading(false)
    }
  }, [orgSlug])

  useEffect(() => { fetchCommitments() }, [fetchCommitments])

  function handleOpenCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function handleOpenEdit(c: CommitmentWithStakeholder) {
    setEditing(c)
    setSheetOpen(true)
  }

  function handleSuccess() {
    setSheetOpen(false)
    setEditing(null)
    fetchCommitments()
  }

  function handleSheetChange(open: boolean) {
    setSheetOpen(open)
    if (!open) setEditing(null)
  }

  const outbound = commitments.filter(c => c.direction === 'outbound')
  const inbound  = commitments.filter(c => c.direction === 'inbound')

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {loading ? '' : `${commitments.length} commitment${commitments.length !== 1 ? 's' : ''}`}
        </p>

        <Sheet open={sheetOpen} onOpenChange={handleSheetChange}>
          <SheetTrigger render={<Button size="sm" className="gap-1.5" onClick={handleOpenCreate} />}>
            <Plus className="w-4 h-4" />
            Agregar
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>{editing ? 'Editar commitment' : 'Nuevo commitment'}</SheetTitle>
            </SheetHeader>
            <CommitmentForm
              commitment={editing ?? undefined}
              onSuccess={handleSuccess}
              onCancel={() => { setSheetOpen(false); setEditing(null) }}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Content */}
      {loading ? (
        <CommitmentsSkeleton />
      ) : commitments.length === 0 ? (
        <EmptyState
          title="Sin commitments"
          description="Registrá un commitment para empezar a trackear compromisos con stakeholders."
          action={
            <Button size="sm" className="gap-1.5" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" />
              Agregar commitment
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <DirectionSection
            title="Yo debo"
            accent="border-blue-500/30"
            commitments={outbound}
            onEdit={handleOpenEdit}
            onRefresh={fetchCommitments}
          />
          <DirectionSection
            title="Me deben"
            accent="border-amber-500/30"
            commitments={inbound}
            onEdit={handleOpenEdit}
            onRefresh={fetchCommitments}
          />
        </div>
      )}
    </div>
  )
}

export default function CommitmentsPage() {
  return (
    <Suspense fallback={<CommitmentsSkeleton />}>
      <CommitmentsContent />
    </Suspense>
  )
}
