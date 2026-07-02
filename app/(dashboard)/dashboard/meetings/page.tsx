'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar, Plus, Users, Sparkles, ExternalLink, Trash2, ChevronDown, ChevronUp,
  FileText, AlertTriangle, ClipboardList, MessageSquare, Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { OrgBadge } from '@/components/shared/org-badge'

// ─── Types ───────────────────────────────────────────────────────────────────

type Stakeholder = { id: string; name: string; role: string | null }
type Org         = { id: string; name: string; color: string }

type Meeting = {
  id:           string
  title:        string
  scheduledAt:  string | null
  notes:        string | null
  prepBrief:    string | null
  meetingUrl:   string | null
  orgId:        string
  organization: Org
  stakeholders: Array<{ stakeholder: Stakeholder }>
  createdAt:    string
}

type PrepBrief = {
  agenda:   string[]
  toReport: string[]
  toAsk:    string[]
  risks:    string[]
}

// ─── Meeting form ─────────────────────────────────────────────────────────────

function MeetingForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const [title,           setTitle]           = useState('')
  const [orgId,           setOrgId]           = useState('')
  const [scheduledAt,     setScheduledAt]     = useState('')
  const [notes,           setNotes]           = useState('')
  const [meetingUrl,      setMeetingUrl]      = useState('')
  const [selectedStks,    setSelectedStks]    = useState<string[]>([])
  const [orgs,            setOrgs]            = useState<Org[]>([])
  const [stakeholders,    setStakeholders]    = useState<Array<Stakeholder & { orgId: string }>>([])
  const [saving,          setSaving]          = useState(false)
  const [error,           setError]           = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/organizations').then(r => r.json()),
      fetch('/api/stakeholders').then(r => r.json()),
    ]).then(([orgsData, stksData]) => {
      if (Array.isArray(orgsData))  setOrgs(orgsData)
      if (Array.isArray(stksData))  setStakeholders(stksData)
    })
  }, [])

  const filteredStakeholders = orgId
    ? stakeholders.filter(s => s.orgId === orgId)
    : stakeholders

  function toggleStk(id: string) {
    setSelectedStks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('El título es requerido'); return }
    if (!orgId)        { setError('La organización es requerida'); return }
    setSaving(true)
    setError(null)

    const res = await fetch('/api/meetings', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        title:          title.trim(),
        orgId,
        scheduledAt:    scheduledAt || null,
        notes:          notes || null,
        meetingUrl:     meetingUrl.trim() || null,
        stakeholderIds: selectedStks,
      }),
    })

    setSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? `Error ${res.status}`)
      return
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Título</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ej: Sync semanal con equipo de producto"
          className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Org */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Organización</label>
        <select
          value={orgId}
          onChange={e => { setOrgId(e.target.value); setSelectedStks([]) }}
          className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        >
          <option value="">Seleccioná una org</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {/* Date/time */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Fecha y hora</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={e => setScheduledAt(e.target.value)}
          className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        />
      </div>

      {/* Stakeholders */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Participantes
          {selectedStks.length > 0 && (
            <span className="ml-1.5 text-primary">({selectedStks.length} seleccionados)</span>
          )}
        </label>
        {filteredStakeholders.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            {orgId ? 'Sin stakeholders en esta org.' : 'Seleccioná una org primero.'}
          </p>
        ) : (
          <div className="border border-border rounded-md divide-y divide-border max-h-40 overflow-y-auto">
            {filteredStakeholders.map(s => (
              <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedStks.includes(s.id)}
                  onChange={() => toggleStk(s.id)}
                  className="rounded cursor-pointer"
                />
                <div>
                  <span className="text-sm">{s.name}</span>
                  {s.role && <span className="text-xs text-muted-foreground ml-1.5">· {s.role}</span>}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Meeting URL */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Link de videollamada (opcional)</label>
        <input
          type="url"
          value={meetingUrl}
          onChange={e => setMeetingUrl(e.target.value)}
          placeholder="https://meet.google.com/..."
          className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Notas / agenda previa</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="Temas a tratar, contexto previo…"
          className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Guardando…' : 'Crear reunión'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

// ─── Prep brief sheet ─────────────────────────────────────────────────────────

function PrepBriefSheet({
  meeting,
  open,
  onClose,
}: {
  meeting: Meeting
  open: boolean
  onClose: () => void
}) {
  const [brief,     setBrief]     = useState<PrepBrief | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!open) { setBrief(null); setError(null) }
  }, [open])

  async function generate() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/meetings/${meeting.id}/prep`, { method: 'POST' })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? `Error ${res.status}`)
      return
    }
    const data = await res.json()
    setBrief(data)
  }

  const sections: Array<{ key: keyof PrepBrief; label: string; icon: React.ReactNode; color: string }> = [
    { key: 'agenda',   label: 'Agenda',           icon: <ClipboardList   className="w-3.5 h-3.5" />, color: 'text-blue-500'   },
    { key: 'toReport', label: 'Qué reportar',     icon: <FileText        className="w-3.5 h-3.5" />, color: 'text-green-500'  },
    { key: 'toAsk',    label: 'Qué pedir/preguntar', icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'text-purple-500' },
    { key: 'risks',    label: 'Riesgos a levantar', icon: <AlertTriangle  className="w-3.5 h-3.5" />, color: 'text-amber-500'  },
  ]

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Meeting Prep Brief
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Meeting info */}
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-sm font-medium">{meeting.title}</p>
            {meeting.scheduledAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(meeting.scheduledAt).toLocaleString('es-ES', {
                  weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
          </div>

          {/* Generate button */}
          <Button
            onClick={generate}
            disabled={loading}
            className="w-full gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Generando…' : brief ? 'Regenerar' : 'Generar brief'}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Skeleton */}
          {loading && (
            <div className="space-y-3 pt-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Brief sections */}
          {!loading && brief && (
            <div className="space-y-4 pt-1">
              {sections.map(({ key, label, icon, color }) => (
                brief[key].length > 0 && (
                  <div key={key} className="rounded-md border border-border bg-card p-3">
                    <p className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${color}`}>
                      {icon}
                      {label}
                    </p>
                    <ul className="space-y-1">
                      {brief[key].map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-muted-foreground shrink-0">·</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Meeting card ─────────────────────────────────────────────────────────────

function MeetingCard({
  meeting,
  onDelete,
  onOpenNarrate,
}: {
  meeting: Meeting
  onDelete: (id: string) => void
  onOpenNarrate: (notes: string) => void
}) {
  const [prepOpen,  setPrepOpen]  = useState(false)
  const [expanded,  setExpanded]  = useState(false)
  const [deleting,  setDeleting]  = useState(false)

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${meeting.title}"?`)) return
    setDeleting(true)
    await fetch(`/api/meetings/${meeting.id}`, { method: 'DELETE' })
    setDeleting(false)
    onDelete(meeting.id)
  }

  const date = meeting.scheduledAt
    ? new Date(meeting.scheduledAt).toLocaleString('es-ES', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Main row */}
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <OrgBadge name={meeting.organization.name} color={meeting.organization.color} />
            {date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {date}
              </span>
            )}
          </div>
          <p className="text-sm font-medium leading-snug">{meeting.title}</p>
          {meeting.stakeholders.length > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <Users className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground truncate">
                {meeting.stakeholders.map(s => s.stakeholder.name).join(', ')}
              </p>
            </div>
          )}
        </div>
        <span className="text-muted-foreground shrink-0 mt-0.5">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-border/50 space-y-3">
          {meeting.notes && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {meeting.notes}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {meeting.meetingUrl && (
              <a
                href={meeting.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
              >
                <Video className="w-3 h-3" />
                Unirse
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 cursor-pointer"
              onClick={() => setPrepOpen(true)}
            >
              <Sparkles className="w-3 h-3" />
              Meeting Prep Brief
            </Button>
            {meeting.notes && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5 cursor-pointer"
                onClick={() => onOpenNarrate(meeting.notes!)}
              >
                <ExternalLink className="w-3 h-3" />
                Abrir en Narrate
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 cursor-pointer text-destructive hover:text-destructive ml-auto"
              disabled={deleting}
              onClick={handleDelete}
            >
              <Trash2 className="w-3 h-3" />
              Eliminar
            </Button>
          </div>
        </div>
      )}

      <PrepBriefSheet
        meeting={meeting}
        open={prepOpen}
        onClose={() => setPrepOpen(false)}
      />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  const router = useRouter()

  const [meetings,   setMeetings]   = useState<Meeting[]>([])
  const [loading,    setLoading]    = useState(true)
  const [sheetOpen,  setSheetOpen]  = useState(false)

  async function fetchMeetings() {
    setLoading(true)
    const res  = await fetch('/api/meetings')
    const data = await res.json()
    if (Array.isArray(data)) setMeetings(data)
    setLoading(false)
  }

  useEffect(() => { fetchMeetings() }, [])

  function openNarrate(notes: string) {
    const encoded = encodeURIComponent(notes)
    router.push(`/dashboard/narrate?prefill=${encoded}`)
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Reuniones</h1>
        <Button size="sm" className="gap-1.5 cursor-pointer" onClick={() => setSheetOpen(true)}>
          <Plus className="w-4 h-4" />
          Nueva reunión
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Sin reuniones. Creá una para empezar.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {meetings.map(m => (
            <MeetingCard
              key={m.id}
              meeting={m}
              onDelete={id => setMeetings(prev => prev.filter(x => x.id !== id))}
              onOpenNarrate={openNarrate}
            />
          ))}
        </div>
      )}

      {/* New meeting sheet */}
      <Sheet open={sheetOpen} onOpenChange={v => !v && setSheetOpen(false)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Nueva reunión</SheetTitle>
          </SheetHeader>
          <MeetingForm
            onSuccess={() => { setSheetOpen(false); fetchMeetings() }}
            onCancel={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
