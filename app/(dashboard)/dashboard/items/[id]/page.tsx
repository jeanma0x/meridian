'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, X, Mail, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CommitmentStatusBadge } from '@/components/shared/commitment-status-badge'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmailDraftSheet } from '@/components/artifacts/email-draft-sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import type { ItemWithOrg, CommitmentWithStakeholder } from '@/types'
import type { Priority, ItemStatus } from '@/lib/generated/prisma/client'

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'URGENT', label: 'Urgente'   },
  { value: 'HIGH',   label: 'Alto'      },
  { value: 'MEDIUM', label: 'Medio'     },
  { value: 'LOW',    label: 'Bajo'      },
]

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: 'TODO',        label: 'Por hacer'   },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'PENDING',     label: 'Pendiente'   },
  { value: 'BLOCKED',     label: 'Bloqueado'   },
  { value: 'DONE',        label: 'Listo'       },
  { value: 'OVERDUE',     label: 'Vencido'     },
]

// ─── Inline text editor ──────────────────────────────────────────────────────
function InlineField({
  value,
  onSave,
  multiline = false,
  className = '',
  placeholder = 'Sin texto',
}: {
  value: string
  onSave: (v: string) => Promise<void>
  multiline?: boolean
  className?: string
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const [saving,  setSaving]  = useState(false)
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null)

  useEffect(() => {
    if (editing) ref.current?.focus()
  }, [editing])

  async function save() {
    const trimmed = draft.trim()
    if (trimmed === value) { setEditing(false); return }
    setSaving(true)
    await onSave(trimmed)
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(value); setEditing(true) }}
        className={`w-full text-left cursor-pointer hover:bg-muted/40 rounded px-1 -mx-1 transition-colors group ${className}`}
      >
        {value
          ? <span className="whitespace-pre-wrap">{value}</span>
          : <span className="text-muted-foreground italic text-sm">{placeholder}</span>}
      </button>
    )
  }

  return (
    <div className="space-y-1.5">
      {multiline ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          value={draft}
          rows={5}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') setEditing(false) }}
          className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed"
        />
      ) : (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}
      <div className="flex gap-1.5">
        <Button size="sm" className="h-7 text-xs gap-1" disabled={saving} onClick={save}>
          <Check className="w-3 h-3" />
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 cursor-pointer" onClick={() => setEditing(false)}>
          <X className="w-3 h-3" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function ItemDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()

  const [item,        setItem]        = useState<ItemWithOrg | null>(null)
  const [commitments, setCommitments] = useState<CommitmentWithStakeholder[]>([])
  const [orgs,        setOrgs]        = useState<{ id: string; name: string; color: string }[]>([])
  const [emailSheet,  setEmailSheet]  = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)

  async function fetchItem() {
    const res = await fetch(`/api/items/${id}`)
    if (!res.ok) { setNotFound(true); setLoading(false); return }
    const data = await res.json()
    setItem(data)
    setLoading(false)
  }

  async function fetchCommitments() {
    const res  = await fetch(`/api/commitments?itemId=${id}`)
    const data = await res.json()
    if (Array.isArray(data)) setCommitments(data)
  }

  async function fetchOrgs() {
    const res  = await fetch('/api/organizations')
    const data = await res.json()
    if (Array.isArray(data)) setOrgs(data)
  }

  useEffect(() => {
    fetchItem()
    fetchCommitments()
    fetchOrgs()
  }, [id])

  async function patch(fields: Record<string, unknown>) {
    const res  = await fetch(`/api/items/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(fields),
    })
    if (res.ok) {
      const data = await res.json()
      setItem(data)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (notFound || !item) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-muted-foreground mb-4">Item no encontrado.</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/items')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver a Items
        </Button>
      </div>
    )
  }

  const selectedOrg      = orgs.find(o => o.id === item.organization.id)
  const selectedPriority = PRIORITY_OPTIONS.find(o => o.value === item.priority)
  const selectedStatus   = STATUS_OPTIONS.find(o => o.value === item.status)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={() => router.push('/dashboard/items')}
        >
          <ArrowLeft className="w-4 h-4" />
          Items
        </Button>
        {item.customId && (
          <span className="text-xs font-mono text-muted-foreground">{item.customId}</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium">Título</p>
            <InlineField
              value={item.title}
              onSave={v => patch({ title: v })}
              className="text-lg font-semibold"
            />
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium">Descripción</p>
            <InlineField
              value={item.description ?? ''}
              onSave={v => patch({ description: v || null })}
              multiline
              className="text-sm text-muted-foreground leading-relaxed"
              placeholder="Agregar descripción…"
            />
          </div>

          {/* Related commitments */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Compromisos relacionados
              {commitments.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-muted text-xs">
                  {commitments.length}
                </span>
              )}
            </p>
            {commitments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sin compromisos vinculados.</p>
            ) : (
              <div className="space-y-2">
                {commitments.map(c => (
                  <div key={c.id} className="flex items-center gap-2.5 rounded-md border border-border bg-card px-3 py-2">
                    <CommitmentStatusBadge status={c.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.stakeholder.name}</p>
                    </div>
                    {c.dueDate && (
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(c.dueDate)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: properties panel */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">

            {/* Org */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Organización</p>
              <Select
                value={item.organization.id}
                onValueChange={v => v && patch({ orgId: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue>
                    {selectedOrg
                      ? <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedOrg.color }} />
                          {selectedOrg.name}
                        </span>
                      : item.organization.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {orgs.map(o => (
                    <SelectItem key={o.id} value={o.id} label={o.name}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: o.color }} />
                        {o.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Prioridad</p>
              <Select
                value={item.priority}
                onValueChange={v => v && patch({ priority: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue>
                    {selectedPriority
                      ? <PriorityBadge priority={item.priority} />
                      : item.priority}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} label={o.label}>
                      <PriorityBadge priority={o.value} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Estado</p>
              <Select
                value={item.status}
                onValueChange={v => v && patch({ status: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue>
                    {selectedStatus
                      ? <StatusBadge status={item.status} />
                      : item.status}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} label={o.label}>
                      <StatusBadge status={o.value} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due date */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Fecha límite</p>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="date"
                  value={item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : ''}
                  onChange={e => patch({ dueDate: e.target.value || null })}
                  className="flex-1 text-xs border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                />
                {item.dueDate && (
                  <button
                    onClick={() => patch({ dueDate: null })}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Quitar fecha"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 cursor-pointer"
            onClick={() => setEmailSheet(true)}
          >
            <Mail className="w-3.5 h-3.5" />
            Redactar email
          </Button>
        </div>
      </div>

      <EmailDraftSheet
        open={emailSheet}
        onClose={() => setEmailSheet(false)}
        context={`${item.title}${item.description ? ` — ${item.description}` : ''}`}
        itemId={item.id}
      />
    </div>
  )
}
