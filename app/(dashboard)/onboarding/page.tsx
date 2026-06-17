'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type OrgDraft = {
  id: string
  name: string
  slug: string
  color: string
  system: string
  selected: boolean
  isCustom: boolean
}

const DEFAULT_ORGS: OrgDraft[] = [
  { id: 'd1', name: 'CMI Guatemala', slug: 'cmi', color: '#185FA5', system: 'ADO', selected: true, isCustom: false },
  { id: 'd2', name: 'Solace', slug: 'solace', color: '#0F6E56', system: 'JIRA', selected: true, isCustom: false },
  { id: 'd3', name: 'GTek Interno', slug: 'gtek', color: '#BA7517', system: 'ADO', selected: true, isCustom: false },
  { id: 'd4', name: 'ASIGBO', slug: 'asigbo', color: '#534AB7', system: 'NOTION', selected: true, isCustom: false },
  { id: 'd5', name: 'Personal', slug: 'personal', color: '#888780', system: 'PERSONAL', selected: true, isCustom: false },
]

const SYSTEM_LABELS: Record<string, string> = {
  ADO: 'Azure DevOps',
  JIRA: 'Jira',
  NOTION: 'Notion',
  PERSONAL: 'Personal',
  OTHER: 'Otro',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [orgs, setOrgs] = useState<OrgDraft[]>(DEFAULT_ORGS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleOrg(id: string) {
    setOrgs(prev => prev.map(o => o.id === id ? { ...o, selected: !o.selected } : o))
  }

  function updateName(id: string, name: string) {
    setOrgs(prev => prev.map(o => o.id === id ? { ...o, name } : o))
  }

  function addCustomOrg() {
    const newOrg: OrgDraft = {
      id: `custom-${Date.now()}`,
      name: '',
      slug: '',
      color: '#6B7280',
      system: 'OTHER',
      selected: true,
      isCustom: true,
    }
    setOrgs(prev => [...prev, newOrg])
  }

  function removeCustomOrg(id: string) {
    setOrgs(prev => prev.filter(o => o.id !== id))
  }

  async function handleSubmit() {
    const selected = orgs.filter(o => o.selected && o.name.trim())
    if (selected.length === 0) {
      setError('Seleccioná al menos una organización para continuar.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await Promise.all(
        selected.map(org =>
          fetch('/api/organizations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: org.name.trim(),
              slug: org.slug || undefined,
              color: org.color,
              system: org.system,
            }),
          }).then(async res => {
            if (!res.ok && res.status !== 409) {
              const data = await res.json()
              throw new Error(data.error || 'Error creando organización')
            }
          })
        )
      )
      router.push('/dashboard/items')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error. Intentá de nuevo.')
      setLoading(false)
    }
  }

  const selectedCount = orgs.filter(o => o.selected && o.name.trim()).length

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Bienvenido a Meridian</h1>
          <p className="text-muted-foreground mt-1">
            Configurá tus organizaciones para empezar a centralizar tu trabajo.
          </p>
        </div>

        {/* Org list */}
        <div className="space-y-2">
          {orgs.map(org => (
            <div
              key={org.id}
              className={cn(
                'flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors cursor-pointer',
                org.selected
                  ? 'bg-card border-border'
                  : 'bg-muted/40 border-transparent opacity-60'
              )}
              onClick={() => !org.isCustom && toggleOrg(org.id)}
            >
              {/* Color dot */}
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: org.color }}
              />

              {/* Name */}
              {org.isCustom ? (
                <Input
                  placeholder="Nombre de la organización"
                  value={org.name}
                  onChange={e => updateName(org.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="h-7 text-sm border-0 bg-transparent p-0 focus-visible:ring-0 flex-1"
                  autoFocus
                />
              ) : (
                <span className="flex-1 text-sm font-medium">{org.name}</span>
              )}

              {/* System badge */}
              <Badge variant="secondary" className="text-xs shrink-0">
                {SYSTEM_LABELS[org.system] ?? org.system}
              </Badge>

              {/* Toggle / Remove */}
              {org.isCustom ? (
                <button
                  onClick={e => { e.stopPropagation(); removeCustomOrg(org.id) }}
                  className="text-muted-foreground hover:text-destructive text-xs cursor-pointer transition-colors"
                >
                  Quitar
                </button>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); toggleOrg(org.id) }}
                  className={cn(
                    'w-5 h-5 rounded border-2 shrink-0 transition-colors cursor-pointer',
                    org.selected
                      ? 'bg-primary border-primary'
                      : 'bg-transparent border-muted-foreground/40'
                  )}
                >
                  {org.selected && (
                    <svg className="w-3 h-3 text-primary-foreground mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add custom */}
        <button
          onClick={addCustomOrg}
          className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1"
        >
          <span className="text-base leading-none">+</span> Agregar organización
        </button>

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}

        {/* Submit */}
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedCount} organización{selectedCount !== 1 ? 'es' : ''} seleccionada{selectedCount !== 1 ? 's' : ''}
          </p>
          <Button onClick={handleSubmit} disabled={loading || selectedCount === 0}>
            {loading ? 'Creando…' : 'Comenzar →'}
          </Button>
        </div>

      </div>
    </div>
  )
}
