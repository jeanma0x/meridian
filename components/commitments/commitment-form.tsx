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
import type { CommitmentWithStakeholder } from '@/types'

type Stakeholder = { id: string; name: string; role: string | null; organization: { name: string; color: string } }
type Item        = { id: string; title: string; customId: string | null }

const DIRECTION_OPTIONS = [
  { value: 'outbound', label: 'Yo debo (outbound)' },
  { value: 'inbound',  label: 'Me deben (inbound)'  },
]

const STATUS_OPTIONS = [
  { value: 'PENDING',   label: 'Pendiente'  },
  { value: 'AT_RISK',   label: 'En riesgo'  },
  { value: 'OVERDUE',   label: 'Vencido'    },
  { value: 'FULFILLED', label: 'Cumplido'   },
]

interface CommitmentFormProps {
  commitment?: CommitmentWithStakeholder
  onSuccess?: (c: CommitmentWithStakeholder) => void
  onCancel?: () => void
}

export function CommitmentForm({ commitment, onSuccess, onCancel }: CommitmentFormProps) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [items,        setItems]        = useState<Item[]>([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const [title,           setTitle]           = useState(commitment?.title           ?? '')
  const [description,     setDescription]     = useState(commitment?.description     ?? '')
  const [stakeholderId,   setStakeholderId]   = useState(commitment?.stakeholderId   ?? '')
  const [direction,       setDirection]       = useState(commitment?.direction       ?? 'outbound')
  const [dueDate,         setDueDate]         = useState(
    commitment?.dueDate ? new Date(commitment.dueDate).toISOString().split('T')[0] : ''
  )
  const [status,  setStatus]  = useState(commitment?.status  ?? 'PENDING')
  const [itemId,  setItemId]  = useState(commitment?.itemId  ?? '')
  const [notes,   setNotes]   = useState(commitment?.notes   ?? '')

  useEffect(() => {
    Promise.all([
      fetch('/api/stakeholders').then(r => r.json()),
      fetch('/api/items').then(r => r.json()),
    ]).then(([sh, it]) => {
      if (Array.isArray(sh)) setStakeholders(sh)
      if (Array.isArray(it)) setItems(it)
    }).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim())    { setError('El título es requerido');         return }
    if (!stakeholderId)   { setError('Seleccioná un stakeholder');      return }

    setLoading(true)
    setError(null)

    const payload = {
      title:         title.trim(),
      description:   description.trim() || null,
      stakeholderId,
      direction,
      dueDate:       dueDate || null,
      status,
      notes:         notes.trim() || null,
      itemId:        itemId || null,
    }

    const url    = commitment ? `/api/commitments/${commitment.id}` : '/api/commitments'
    const method = commitment ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
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

  const selectedStakeholder = stakeholders.find(s => s.id === stakeholderId)
  const selectedDirection   = DIRECTION_OPTIONS.find(o => o.value === direction)
  const selectedStatus      = STATUS_OPTIONS.find(o => o.value === status)
  const selectedItem        = items.find(i => i.id === itemId)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <Input
        placeholder="Título del commitment *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
      />

      {/* Description */}
      <Textarea
        placeholder="Descripción (opcional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={2}
        className="resize-none"
      />

      {/* Stakeholder + Direction */}
      <div className="grid grid-cols-2 gap-3">
        <Select value={stakeholderId} onValueChange={v => v && setStakeholderId(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Stakeholder">
              {selectedStakeholder
                ? <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedStakeholder.organization.color }} />
                    {selectedStakeholder.name}
                  </span>
                : <span className="text-muted-foreground">Stakeholder</span>
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {stakeholders.map(s => (
              <SelectItem key={s.id} value={s.id} label={s.name}>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.organization.color }} />
                  <span>
                    <span className="block text-sm">{s.name}</span>
                    {s.role && <span className="block text-xs text-muted-foreground">{s.role}</span>}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={direction} onValueChange={v => v && setDirection(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Dirección">
              {selectedDirection?.label ?? <span className="text-muted-foreground">Dirección</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DIRECTION_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value} label={o.label}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Due date + Status */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="text-sm"
        />

        <Select value={status} onValueChange={v => v && setStatus(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Estado">
              {selectedStatus?.label ?? <span className="text-muted-foreground">Estado</span>}
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
      </div>

      {/* Related item (optional) */}
      <Select value={itemId} onValueChange={v => setItemId(!v || v === '__none' ? '' : v)}>
        <SelectTrigger>
          <SelectValue placeholder="Item relacionado (opcional)">
            {selectedItem
              ? <span>{selectedItem.customId ? `${selectedItem.customId} · ` : ''}{selectedItem.title}</span>
              : <span className="text-muted-foreground">Item relacionado (opcional)</span>
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none" label="Sin item">
            <span className="text-muted-foreground">Sin item relacionado</span>
          </SelectItem>
          {items.map(i => (
            <SelectItem key={i.id} value={i.id} label={i.title}>
              <span className="flex items-center gap-2">
                {i.customId && <span className="text-xs font-mono text-muted-foreground">{i.customId}</span>}
                {i.title}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Notes */}
      <Textarea
        placeholder="Notas internas (opcional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
        className="resize-none"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando…' : commitment ? 'Guardar cambios' : 'Crear commitment'}
        </Button>
      </div>
    </form>
  )
}
