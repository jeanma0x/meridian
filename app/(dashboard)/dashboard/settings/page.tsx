'use client'

import { useEffect, useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { Pencil, Trash2, Check, X, LogOut, Building2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { OrgSystem } from '@/lib/generated/prisma/client'

type Org = {
  id:        string
  name:      string
  color:     string
  system:    OrgSystem
  systemUrl: string | null
  slug:      string
}

const SYSTEM_LABELS: Record<OrgSystem, string> = {
  ADO:      'Azure DevOps',
  JIRA:     'Jira',
  NOTION:   'Notion',
  PERSONAL: 'Personal',
  OTHER:    'Otro',
}

const ORG_COLORS = [
  '#185FA5', '#0EA5E9', '#8B5CF6', '#EC4899',
  '#10B981', '#F59E0B', '#EF4444', '#6366F1',
  '#14B8A6', '#F97316',
]

function InlineEdit({
  value,
  onSave,
  className = '',
}: {
  value: string
  onSave: (v: string) => Promise<void>
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const [saving,  setSaving]  = useState(false)

  async function save() {
    if (!draft.trim() || draft === value) { setEditing(false); return }
    setSaving(true)
    await onSave(draft.trim())
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(value); setEditing(true) }}
        className={`group flex items-center gap-1.5 text-left cursor-pointer hover:text-primary transition-colors ${className}`}
      >
        <span>{value}</span>
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        className="text-sm border border-border rounded px-2 py-0.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <button onClick={save} disabled={saving} className="text-green-600 hover:text-green-700 cursor-pointer p-0.5">
        <Check className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function OrgForm({
  org,
  onSuccess,
  onCancel,
}: {
  org?: Org
  onSuccess: () => void
  onCancel: () => void
}) {
  const [name,   setName]   = useState(org?.name   ?? '')
  const [color,  setColor]  = useState(org?.color  ?? '#185FA5')
  const [system, setSystem] = useState<OrgSystem>(org?.system ?? 'OTHER')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es requerido'); return }
    setSaving(true)
    setError(null)

    const url    = org ? `/api/organizations/${org.id}` : '/api/organizations'
    const method = org ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), color, system }),
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
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Nombre</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre de la organización"
          className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Sistema</label>
        <select
          value={system}
          onChange={e => setSystem(e.target.value as OrgSystem)}
          className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        >
          {(Object.keys(SYSTEM_LABELS) as OrgSystem[]).map(s => (
            <option key={s} value={s}>{SYSTEM_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Color</label>
        <div className="flex flex-wrap gap-2">
          {ORG_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full border-2 cursor-pointer transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? 'hsl(var(--foreground))' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Guardando…' : org ? 'Guardar cambios' : 'Crear organización'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export default function SettingsPage() {
  const { signOut } = useClerk()

  const [orgs,       setOrgs]       = useState<Org[]>([])
  const [userName,   setUserName]   = useState('')
  const [sheetOpen,  setSheetOpen]  = useState(false)
  const [editingOrg, setEditingOrg] = useState<Org | undefined>(undefined)
  const [deleting,   setDeleting]   = useState<string | null>(null)

  async function fetchData() {
    const [orgsRes, userRes] = await Promise.all([
      fetch('/api/organizations'),
      fetch('/api/user'),
    ])
    const orgsData = await orgsRes.json()
    const userData = await userRes.json()
    if (Array.isArray(orgsData)) setOrgs(orgsData)
    if (userData?.name)         setUserName(userData.name)
    else if (userData?.email)   setUserName(userData.email)
  }

  useEffect(() => { fetchData() }, [])

  async function saveUserName(name: string) {
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) setUserName(name)
  }

  async function deleteOrg(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return
    setDeleting(id)
    const res = await fetch(`/api/organizations/${id}`, { method: 'DELETE' })
    setDeleting(null)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Error al eliminar')
      return
    }
    fetchData()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <h1 className="text-xl font-semibold">Settings</h1>

      {/* Organizaciones */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Organizaciones</h2>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => { setEditingOrg(undefined); setSheetOpen(true) }}
          >
            + Nueva org
          </Button>
        </div>

        <div className="space-y-2">
          {orgs.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin organizaciones.</p>
          )}
          {orgs.map(org => (
            <div
              key={org.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: org.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{org.name}</p>
                <p className="text-xs text-muted-foreground">{SYSTEM_LABELS[org.system]}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 cursor-pointer"
                  onClick={() => { setEditingOrg(org); setSheetOpen(true) }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 cursor-pointer text-destructive hover:text-destructive"
                  disabled={deleting === org.id}
                  onClick={() => deleteOrg(org.id, org.name)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Perfil */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Perfil</h2>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1">Nombre</p>
          {userName ? (
            <InlineEdit
              value={userName}
              onSave={saveUserName}
              className="text-sm font-medium"
            />
          ) : (
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          )}
        </div>
      </section>

      {/* Cuenta */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <LogOut className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Cuenta</h2>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-4">
          <p className="text-sm text-muted-foreground mb-3">Cerrá sesión en este dispositivo.</p>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5 cursor-pointer"
            onClick={() => signOut({ redirectUrl: '/sign-in' })}
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </Button>
        </div>
      </section>

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={v => !v && setSheetOpen(false)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {editingOrg ? `Editar "${editingOrg.name}"` : 'Nueva organización'}
            </SheetTitle>
          </SheetHeader>
          <OrgForm
            org={editingOrg}
            onSuccess={() => { setSheetOpen(false); fetchData() }}
            onCancel={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
