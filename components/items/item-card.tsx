'use client'

import { useState } from 'react'
import { Check, Trash2, ChevronDown, ChevronUp, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { OrgBadge } from '@/components/shared/org-badge'
import { EmailDraftSheet } from '@/components/artifacts/email-draft-sheet'
import { formatDate, cn } from '@/lib/utils'
import type { ItemWithOrg } from '@/types'

interface ItemCardProps {
  item: ItemWithOrg
  onRefresh?: () => void
  compact?: boolean
}

export function ItemCard({ item, onRefresh, compact = false }: ItemCardProps) {
  const [expanded,    setExpanded]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [emailSheet,  setEmailSheet]  = useState(false)

  async function markDone(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading(true)
    await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONE' }),
    })
    onRefresh?.()
    setLoading(false)
  }

  async function deleteItem(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`¿Eliminar "${item.title}"?`)) return
    setLoading(true)
    await fetch(`/api/items/${item.id}`, { method: 'DELETE' })
    onRefresh?.()
    setLoading(false)
  }

  return (
    <div
      className="rounded-lg bg-card overflow-hidden"
      style={{
        border: '1px solid hsl(var(--border))',
        borderLeft: `3px solid ${item.organization.color}`,
      }}
    >
      {/* Main row */}
      <div
        className={cn(
          'flex items-start gap-3 px-4 py-3 transition-colors',
          !compact && 'cursor-pointer hover:bg-muted/30',
        )}
        onClick={() => !compact && setExpanded(e => !e)}
      >
        {/* Left: meta + title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            {item.customId && (
              <span className="text-xs font-mono text-muted-foreground">{item.customId}</span>
            )}
            <OrgBadge name={item.organization.name} color={item.organization.color} />
          </div>
          <p className="text-sm font-medium leading-snug line-clamp-2">{item.title}</p>
          {item.dueDate && (
            <p className={cn(
              'text-xs mt-1',
              item.status === 'OVERDUE' ? 'text-destructive' : 'text-muted-foreground',
            )}>
              {formatDate(item.dueDate)}
            </p>
          )}
        </div>

        {/* Right: badges + chevron */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <PriorityBadge priority={item.priority} />
          <StatusBadge status={item.status} />
          {!compact && (
            <span className="text-muted-foreground ml-1">
              {expanded
                ? <ChevronUp className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          )}
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && !compact && (
        <div className="px-4 pb-4 pt-3 border-t border-border/50">
          {item.description && (
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{item.description}</p>
          )}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.tags.map(({ tag }) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">{tag.name}</Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {item.status !== 'DONE' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                disabled={loading}
                onClick={markDone}
              >
                <Check className="w-3 h-3" />
                Marcar listo
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 cursor-pointer"
              disabled={loading}
              onClick={e => { e.stopPropagation(); setEmailSheet(true) }}
            >
              <Mail className="w-3 h-3" />
              Redactar email
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
              disabled={loading}
              onClick={deleteItem}
            >
              <Trash2 className="w-3 h-3" />
              Eliminar
            </Button>
          </div>
        </div>
      )}

      <EmailDraftSheet
        open={emailSheet}
        onClose={() => setEmailSheet(false)}
        context={`${item.title}${item.description ? ` — ${item.description}` : ''}`}
        itemId={item.id}
      />
    </div>
  )
}
