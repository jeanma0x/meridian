'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ItemWithOrg } from '@/types'

type Org = { id: string; name: string; color: string; slug: string }

const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: 'Urgente' },
  { value: 'HIGH',   label: 'Alto'    },
  { value: 'MEDIUM', label: 'Medio'   },
  { value: 'LOW',    label: 'Bajo'    },
]

const STATUS_OPTIONS = [
  { value: 'TODO',        label: 'Por hacer'  },
  { value: 'IN_PROGRESS', label: 'En curso'   },
  { value: 'PENDING',     label: 'Pendiente'  },
  { value: 'BLOCKED',     label: 'Bloqueado'  },
  { value: 'DONE',        label: 'Listo'      },
]

interface ItemFormProps {
  item?: ItemWithOrg
  defaultOrgId?: string
  onSuccess?: (item: ItemWithOrg) => void
  onCancel?: () => void
}

export function ItemForm({ item, defaultOrgId, onSuccess, onCancel }: ItemFormProps) {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title,       setTitle]       = useState(item?.title       ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [orgId,       setOrgId]       = useState(item?.orgId ?? defaultOrgId ?? '')
  const [priority,    setPriority]    = useState(item?.priority ?? 'MEDIUM')
  const [status,      setStatus]      = useState(item?.status   ?? 'TODO')
  const [dueDate,     setDueDate]     = useState(
    item?.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : ''
  )
  const [tags, setTags] = useState(item?.tags.map(t => t.tag.name).join(', ') ?? '')

  useEffect(() => {
    fetch('/api/organizations')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrgs(data)
          if (!orgId && data.length > 0) setOrgId(data[0].id)
        }
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('El título es requerido'); return }
    if (!orgId)        { setError('Seleccioná una organización'); return }

    setLoading(true)
    setError(null)

    const payload = {
      title:       title.trim(),
      description: description.trim() || null,
      orgId,
      priority,
      status,
      dueDate: dueDate || null,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    }

    const url    = item ? `/api/items/${item.id}` : '/api/items'
    const method = item ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.error('[ItemForm] save error:', res.status, data)
      setError(data.error ?? `Error ${res.status}`)
      return
    }

    const saved = await res.json()
    onSuccess?.(saved)
  }

  const selectedOrg = orgs.find(o => o.id === orgId)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <Input
        placeholder="Título del item *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
      />

      {/* Description */}
      <Textarea
        placeholder="Descripción (opcional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={3}
        className="resize-none"
      />

      {/* Org + Priority */}
      <div className="grid grid-cols-2 gap-3">
        {/* Org selector — label derived from resolved org name */}
        <Select
          value={orgId}
          onValueChange={v => v && setOrgId(v)}
        >
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

        {/* Priority selector */}
        <Select value={priority} onValueChange={v => v && setPriority(v as typeof priority)}>
          <SelectTrigger>
            <SelectValue placeholder="Prioridad">
              {PRIORITY_OPTIONS.find(o => o.value === priority)?.label
                ?? <span className="text-muted-foreground">Prioridad</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value} label={o.label}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status + Due date */}
      <div className="grid grid-cols-2 gap-3">
        <Select value={status} onValueChange={v => v && setStatus(v as typeof status)}>
          <SelectTrigger>
            <SelectValue placeholder="Estado">
              {STATUS_OPTIONS.find(o => o.value === status)?.label
                ?? <span className="text-muted-foreground">Estado</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value} label={o.label}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Tags */}
      <Input
        placeholder="Tags (separados por coma: bug, frontend, ux)"
        value={tags}
        onChange={e => setTags(e.target.value)}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando…' : item ? 'Guardar cambios' : 'Crear item'}
        </Button>
      </div>
    </form>
  )
}
