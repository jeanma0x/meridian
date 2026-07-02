'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StakeholderWithOrg } from '@/types'

type Org = { id: string; name: string; color: string; slug: string }

const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
]

interface StakeholderFormProps {
  stakeholder?: StakeholderWithOrg
  defaultOrgId?: string
  onSuccess?: (s: StakeholderWithOrg) => void
  onCancel?: () => void
}

export function StakeholderForm({ stakeholder, defaultOrgId, onSuccess, onCancel }: StakeholderFormProps) {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name,               setName]               = useState(stakeholder?.name               ?? '')
  const [role,               setRole]               = useState(stakeholder?.role               ?? '')
  const [email,              setEmail]              = useState(stakeholder?.email              ?? '')
  const [orgId,              setOrgId]              = useState(stakeholder?.orgId ?? defaultOrgId ?? '')
  const [formalityLevel,     setFormalityLevel]     = useState(stakeholder?.formalityLevel     ?? 50)
  const [language,           setLanguage]           = useState(stakeholder?.language           ?? 'es')
  const [communicationStyle, setCommunicationStyle] = useState(
    stakeholder?.communicationStyle?.join(', ') ?? ''
  )

  useEffect(() => {
    fetch('/api/organizations')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setOrgs(data)
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es requerido'); return }
    if (!orgId)        { setError('Seleccioná una organización'); return }

    setLoading(true)
    setError(null)

    const tags = communicationStyle
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const payload = {
      name: name.trim(),
      role: role.trim() || null,
      email: email.trim() || null,
      orgId,
      formalityLevel,
      language,
      communicationStyle: tags,
    }

    const url    = stakeholder ? `/api/stakeholders/${stakeholder.id}` : '/api/stakeholders'
    const method = stakeholder ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? `Error ${res.status}`)
      return
    }

    const saved = await res.json()
    onSuccess?.(saved)
  }

  const selectedOrg = orgs.find(o => o.id === orgId)
  const selectedLang = LANGUAGE_OPTIONS.find(o => o.value === language)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <Input
        placeholder="Nombre *"
        value={name}
        onChange={e => setName(e.target.value)}
        autoFocus
      />

      {/* Role */}
      <Input
        placeholder="Rol / cargo (opcional)"
        value={role}
        onChange={e => setRole(e.target.value)}
      />

      {/* Email */}
      <Input
        type="email"
        placeholder="Email (opcional)"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      {/* Org + Language */}
      <div className="grid grid-cols-2 gap-3">
        <Select value={orgId} onValueChange={v => v && setOrgId(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Organización">
              {selectedOrg
                ? <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedOrg.color }} />
                    {selectedOrg.name}
                  </span>
                : <span className="text-muted-foreground">Organización</span>
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {orgs.map(org => (
              <SelectItem key={org.id} value={org.id} label={org.name}>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: org.color }} />
                  {org.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={language} onValueChange={v => v && setLanguage(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Idioma">
              {selectedLang?.label ?? <span className="text-muted-foreground">Idioma</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value} label={o.label}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Formality level */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-muted-foreground">Nivel de formalidad</label>
          <span className="text-sm font-medium">{formalityLevel}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={formalityLevel}
          onChange={e => setFormalityLevel(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Muy informal</span>
          <span>Muy formal</span>
        </div>
      </div>

      {/* Communication style */}
      <Input
        placeholder="Estilo de comunicación (separados por coma: directo, técnico, ejecutivo)"
        value={communicationStyle}
        onChange={e => setCommunicationStyle(e.target.value)}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando…' : stakeholder ? 'Guardar cambios' : 'Crear stakeholder'}
        </Button>
      </div>
    </form>
  )
}
