'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, ArrowUpRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { EmptyState } from '@/components/shared/empty-state'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { OrgBadge } from '@/components/shared/org-badge'
import { formatDate } from '@/lib/utils'
import type { FocusItem } from '@/types'

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function todayLabel() {
  const d = new Date()
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`
}

function FocusSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface NextStepSheetProps {
  item: FocusItem['item'] | null
  open: boolean
  onClose: () => void
}

function NextStepSheet({ item, open, onClose }: NextStepSheetProps) {
  const [loading,  setLoading]  = useState(false)
  const [nextStep, setNextStep] = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    if (!open || !item) return
    setNextStep(null)
    setError(null)
    setLoading(true)

    fetch('/api/focus/next-step', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: item.title }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setNextStep(data.nextStep ?? null)
      })
      .catch(() => setError('Error de conexión'))
      .finally(() => setLoading(false))
  }, [open, item])

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Siguiente paso
          </SheetTitle>
        </SheetHeader>

        {item && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">{item.title}</p>

            {loading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {nextStep && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <p className="text-sm leading-relaxed">{nextStep}</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default function FocusPage() {
  const [focusItems,  setFocusItems]  = useState<FocusItem[]>([])
  const [loading,     setLoading]     = useState(true)
  const [sheetItem,   setSheetItem]   = useState<FocusItem['item'] | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  async function fetchFocus() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/focus')
      const data = await res.json()
      if (res.ok && Array.isArray(data)) setFocusItems(data)
      else setError(data.error ?? 'Error al cargar el focus')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFocus() }, [])

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Focus de hoy</h1>
          <p className="text-sm text-muted-foreground capitalize">{todayLabel()}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          onClick={fetchFocus}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Content */}
      {loading ? (
        <FocusSkeleton />
      ) : focusItems.length === 0 ? (
        <EmptyState
          title="Sin items para hoy"
          description="Agregá items a tu backlog para que el Focus pueda priorizarlos."
          action={
            <Button size="sm" render={<Link href="/dashboard/items" />}>
              Ir a Items
            </Button>
          }
        />
      ) : (
        <ol className="space-y-5">
          {focusItems.map((f, idx) => (
            <li key={f.id} className="flex gap-4">
              {/* Number */}
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-lg">
                {idx + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug">{f.item.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <OrgBadge
                        name={f.item.organization.name}
                        color={f.item.organization.color}
                      />
                      <PriorityBadge priority={f.item.priority} />
                      {f.item.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(f.item.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 shrink-0 cursor-pointer"
                    onClick={() => setSheetItem(f.item)}
                  >
                    Siguiente paso
                    <ArrowUpRight className="w-3 h-3" />
                  </Button>
                </div>

                {/* Reason card */}
                <div className="rounded-md bg-muted/50 border-l-2 border-primary/40 px-3 py-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.reason}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <NextStepSheet
        item={sheetItem}
        open={sheetItem !== null}
        onClose={() => setSheetItem(null)}
      />
    </div>
  )
}
