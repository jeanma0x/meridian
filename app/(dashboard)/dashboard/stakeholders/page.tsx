'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
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
import { StakeholderCard } from '@/components/stakeholders/stakeholder-card'
import { StakeholderForm } from '@/components/stakeholders/stakeholder-form'
import type { StakeholderWithOrg } from '@/types'

function StakeholdersSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full rounded-lg" />
      ))}
    </div>
  )
}

function StakeholdersContent() {
  const searchParams = useSearchParams()
  const orgSlug = searchParams.get('org') ?? undefined

  const [stakeholders, setStakeholders] = useState<StakeholderWithOrg[]>([])
  const [loading,      setLoading]      = useState(true)
  const [sheetOpen,    setSheetOpen]    = useState(false)
  const [editing,      setEditing]      = useState<StakeholderWithOrg | null>(null)

  const fetchStakeholders = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/stakeholders')
      const data = await res.json()
      if (!Array.isArray(data)) return

      const filtered = orgSlug
        ? data.filter((s: StakeholderWithOrg) => s.organization.slug === orgSlug)
        : data

      setStakeholders(filtered)
    } catch {
      setStakeholders([])
    } finally {
      setLoading(false)
    }
  }, [orgSlug])

  useEffect(() => { fetchStakeholders() }, [fetchStakeholders])

  function handleOpenCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function handleOpenEdit(s: StakeholderWithOrg) {
    setEditing(s)
    setSheetOpen(true)
  }

  function handleSuccess() {
    setSheetOpen(false)
    setEditing(null)
    fetchStakeholders()
  }

  function handleSheetChange(open: boolean) {
    setSheetOpen(open)
    if (!open) setEditing(null)
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {loading ? '' : `${stakeholders.length} stakeholder${stakeholders.length !== 1 ? 's' : ''}`}
        </p>

        <Sheet open={sheetOpen} onOpenChange={handleSheetChange}>
          <SheetTrigger render={<Button size="sm" className="gap-1.5" onClick={handleOpenCreate} />}>
            <Plus className="w-4 h-4" />
            Agregar
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>{editing ? 'Editar stakeholder' : 'Nuevo stakeholder'}</SheetTitle>
            </SheetHeader>
            <StakeholderForm
              stakeholder={editing ?? undefined}
              onSuccess={handleSuccess}
              onCancel={() => { setSheetOpen(false); setEditing(null) }}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Content */}
      {loading ? (
        <StakeholdersSkeleton />
      ) : stakeholders.length === 0 ? (
        <EmptyState
          title="Sin stakeholders"
          description="Agregá un stakeholder para empezar a trackear tus relaciones."
          action={
            <Button size="sm" className="gap-1.5" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" />
              Agregar stakeholder
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stakeholders.map(s => (
            <StakeholderCard
              key={s.id}
              stakeholder={s}
              onEdit={handleOpenEdit}
              onRefresh={fetchStakeholders}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function StakeholdersPage() {
  return (
    <Suspense fallback={<StakeholdersSkeleton />}>
      <StakeholdersContent />
    </Suspense>
  )
}
