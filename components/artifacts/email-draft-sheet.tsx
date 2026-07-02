'use client'

import { useEffect, useState } from 'react'
import { Mail, Copy, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Stakeholder = {
  id:           string
  name:         string
  role:         string | null
  email:        string | null
  organization: { name: string; color: string }
}

interface EmailDraftSheetProps {
  open:              boolean
  onClose:           () => void
  context:           string
  itemId?:           string
  commitmentId?:     string
  stakeholderId?:    string
}

export function EmailDraftSheet({ open, onClose, context, itemId, commitmentId, stakeholderId: defaultStakeholderId }: EmailDraftSheetProps) {
  const [stakeholders,   setStakeholders]   = useState<Stakeholder[]>([])
  const [stakeholderId,  setStakeholderId]  = useState(defaultStakeholderId ?? '')
  const [generating,     setGenerating]     = useState(false)
  const [subject,        setSubject]        = useState('')
  const [body,           setBody]           = useState('')
  const [error,          setError]          = useState<string | null>(null)
  const [copied,         setCopied]         = useState(false)

  useEffect(() => {
    if (!open) return
    fetch('/api/stakeholders')
      .then(r => r.json())
      .then(data => Array.isArray(data) && setStakeholders(data))
      .catch(() => {})
  }, [open])

  // Reset draft when sheet closes
  useEffect(() => {
    if (!open) {
      setSubject('')
      setBody('')
      setError(null)
      setStakeholderId(defaultStakeholderId ?? '')
    }
  }, [open, defaultStakeholderId])

  async function handleGenerate() {
    if (!stakeholderId) { setError('Seleccioná un destinatario'); return }
    setGenerating(true)
    setError(null)
    setSubject('')
    setBody('')

    const res = await fetch('/api/artifacts/email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ stakeholderId, itemId, commitmentId, context }),
    })

    setGenerating(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? `Error ${res.status}`)
      return
    }

    const data = await res.json()
    setSubject(data.subject ?? '')
    setBody(data.body ?? '')
  }

  async function handleCopy() {
    if (!body) return
    await navigator.clipboard.writeText(`Asunto: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleMailto() {
    const sh = stakeholders.find(s => s.id === stakeholderId)
    const to = sh?.email ?? ''
    window.open(
      `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      '_blank',
    )
  }

  const selectedStakeholder = stakeholders.find(s => s.id === stakeholderId)

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Redactar email
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Context preview */}
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{context}</p>
          </div>

          {/* Stakeholder select */}
          <Select value={stakeholderId} onValueChange={v => v && setStakeholderId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccioná el destinatario">
                {selectedStakeholder
                  ? <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedStakeholder.organization.color }} />
                      {selectedStakeholder.name}
                      {selectedStakeholder.role && <span className="text-muted-foreground">· {selectedStakeholder.role}</span>}
                    </span>
                  : <span className="text-muted-foreground">Seleccioná el destinatario</span>
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

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !stakeholderId}
            className="w-full gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? 'Generando…' : subject ? 'Regenerar' : 'Generar borrador'}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Loading skeleton */}
          {generating && (
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {/* Draft preview */}
          {!generating && subject && (
            <div className="space-y-3 pt-1">
              {/* Subject */}
              <div className="rounded-md border border-border bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Asunto</p>
                <p className="text-sm font-medium">{subject}</p>
              </div>

              {/* Body */}
              <div className="rounded-md border border-border bg-card px-3 py-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Cuerpo</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{body}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 cursor-pointer"
                  onClick={handleCopy}
                >
                  {copied
                    ? <><Check className="w-3.5 h-3.5" />Copiado</>
                    : <><Copy className="w-3.5 h-3.5" />Copiar</>
                  }
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 cursor-pointer"
                  onClick={handleMailto}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Abrir en Mail
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
