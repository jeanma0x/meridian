'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, RotateCcw, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { CommitmentForm } from '@/components/commitments/commitment-form'
import { ItemForm } from '@/components/items/item-form'
import type { NarrateResult } from '@/types'
import type { CommitmentWithStakeholder, ItemWithOrg } from '@/types'

const EXAMPLE_TEXT = `Reunión de seguimiento — Proyecto Plataforma Digital
Participantes: Jean (PM), Rodrigo (Dev Lead), Carla (QA), Miguel (Cliente)

Decidimos posponer el lanzamiento al 15 de agosto para incluir el módulo de reportes.
Miguel confirmó que el módulo de reportes es bloqueante para el go-live.

Jean se comprometió a enviar el spec de reportes a Miguel antes del viernes.
Rodrigo va a terminar la integración del API de pagos esta semana.
Carla necesita los ambientes de staging antes del lunes para empezar QA.

Riesgo: la integración con el sistema legado del cliente puede demorar 2 semanas más.
Riesgo: Rodrigo mencionó deuda técnica en el módulo de autenticación que podría causar problemas en producción.

Próximos pasos:
- Jean envía spec de reportes (viernes)
- Rodrigo termina integración de pagos (jueves)
- Carla configura plan de pruebas para el módulo de reportes
- Miguel revisa y aprueba el spec para el lunes`

const SEVERITY_STYLES: Record<string, string> = {
  low:    'bg-muted text-muted-foreground border-transparent',
  medium: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  high:   'bg-destructive/15 text-destructive border-destructive/30',
}

const SEVERITY_LABELS: Record<string, string> = {
  low: 'Bajo', medium: 'Medio', high: 'Alto',
}

const PRIORITY_STYLES: Record<string, string> = {
  low:    'bg-muted text-muted-foreground border-transparent',
  medium: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  high:   'bg-orange-500/15 text-orange-500 border-orange-500/30',
}

type SheetMode =
  | { type: 'commitment'; defaults: { title: string; direction: string; notes: string } }
  | { type: 'item'; defaultTitle: string }
  | null

function NarrateContent() {
  const searchParams = useSearchParams()
  const prefill      = searchParams.get('prefill')
  const [text,    setText]    = useState(prefill ? decodeURIComponent(prefill) : EXAMPLE_TEXT)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [result,  setResult]  = useState<NarrateResult | null>(null)
  const [sheet,   setSheet]   = useState<SheetMode>(null)

  async function handleParse() {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res  = await fetch('/api/narrate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Error ${res.status}`)
        return
      }
      setResult(await res.json())
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError(null)
    setText(EXAMPLE_TEXT)
  }

  function openCommitmentSheet(c: NarrateResult['commitments'][number]) {
    setSheet({
      type: 'commitment',
      defaults: {
        title:     c.action,
        direction: c.direction,
        notes:     `Persona: ${c.person} · Riesgo: ${SEVERITY_LABELS[c.risk] ?? c.risk}${c.deadline ? ` · Fecha límite: ${c.deadline}` : ''}`,
      },
    })
  }

  function openItemSheet(a: NarrateResult['actions'][number]) {
    setSheet({ type: 'item', defaultTitle: `${a.task}${a.person ? ` (${a.person})` : ''}` })
  }

  function handleSheetSuccess(_saved: CommitmentWithStakeholder | ItemWithOrg) {
    setSheet(null)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Input area */}
      <div className="space-y-3">
        <Textarea
          placeholder="Pegá las notas de reunión acá…"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={10}
          className="resize-none font-mono text-sm"
        />

        <div className="flex items-center gap-3">
          <Button onClick={handleParse} disabled={loading || !text.trim()} className="gap-2">
            <Sparkles className="w-4 h-4" />
            {loading ? 'Procesando…' : 'Parsear con IA'}
          </Button>
          {result && (
            <Button variant="ghost" onClick={handleReset} className="gap-2 text-muted-foreground">
              <RotateCcw className="w-4 h-4" />
              Limpiar
            </Button>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Decisions */}
          {result.decisions?.length > 0 && (
            <ResultCard title="Decisiones" count={result.decisions.length} accent="border-l-primary">
              <ul className="space-y-2">
                {result.decisions.map((d, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-muted-foreground shrink-0 font-mono text-xs pt-0.5">{i + 1}.</span>
                    {d.text}
                  </li>
                ))}
              </ul>
            </ResultCard>
          )}

          {/* Commitments */}
          {result.commitments?.length > 0 && (
            <ResultCard title="Compromisos" count={result.commitments.length} accent="border-l-blue-500">
              <div className="space-y-2">
                {result.commitments.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-xs font-medium text-muted-foreground">{c.person}</span>
                        <Badge variant="outline" className={SEVERITY_STYLES[c.risk]}>
                          {SEVERITY_LABELS[c.risk] ?? c.risk}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {c.direction === 'outbound' ? 'Yo debo' : 'Me deben'}
                        </Badge>
                      </div>
                      <p className="text-sm">{c.action}</p>
                      {c.deadline && (
                        <p className="text-xs text-muted-foreground mt-0.5">Fecha: {c.deadline}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 shrink-0 cursor-pointer"
                      onClick={() => openCommitmentSheet(c)}
                    >
                      <Plus className="w-3 h-3" />
                      Agregar
                    </Button>
                  </div>
                ))}
              </div>
            </ResultCard>
          )}

          {/* Risks */}
          {result.risks?.length > 0 && (
            <ResultCard title="Riesgos" count={result.risks.length} accent="border-l-destructive">
              <ul className="space-y-2">
                {result.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className={`${SEVERITY_STYLES[r.severity]} shrink-0 mt-0.5`}>
                      {SEVERITY_LABELS[r.severity] ?? r.severity}
                    </Badge>
                    <span className="text-sm">{r.text}</span>
                  </li>
                ))}
              </ul>
            </ResultCard>
          )}

          {/* Actions */}
          {result.actions?.length > 0 && (
            <ResultCard title="Próximos pasos" count={result.actions.length} accent="border-l-emerald-500">
              <div className="space-y-2">
                {result.actions.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-muted-foreground">{a.person}</span>
                        <Badge variant="outline" className={PRIORITY_STYLES[a.priority]}>
                          {SEVERITY_LABELS[a.priority] ?? a.priority}
                        </Badge>
                      </div>
                      <p className="text-sm">{a.task}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 shrink-0 cursor-pointer"
                      onClick={() => openItemSheet(a)}
                    >
                      <Plus className="w-3 h-3" />
                      Crear item
                    </Button>
                  </div>
                ))}
              </div>
            </ResultCard>
          )}
        </div>
      )}

      {/* Sheet for commitment/item creation */}
      <Sheet open={sheet !== null} onOpenChange={open => !open && setSheet(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {sheet?.type === 'commitment' ? 'Nuevo commitment' : 'Nuevo item'}
            </SheetTitle>
          </SheetHeader>
          {sheet?.type === 'commitment' && (
            <CommitmentForm
              defaults={sheet.defaults}
              onSuccess={handleSheetSuccess}
              onCancel={() => setSheet(null)}
            />
          )}
          {sheet?.type === 'item' && (
            <ItemForm
              defaultTitle={sheet.defaultTitle}
              onSuccess={handleSheetSuccess}
              onCancel={() => setSheet(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default function NarratePage() {
  return (
    <Suspense>
      <NarrateContent />
    </Suspense>
  )
}

function ResultCard({
  title,
  count,
  accent,
  children,
}: {
  title: string
  count: number
  accent: string
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-lg bg-card border border-border border-l-2 ${accent} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none">
          {count}
        </span>
      </div>
      {children}
    </div>
  )
}
