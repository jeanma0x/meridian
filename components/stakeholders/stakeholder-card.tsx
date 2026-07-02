'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrgBadge } from '@/components/shared/org-badge'
import { cn } from '@/lib/utils'
import type { StakeholderWithOrg } from '@/types'

interface StakeholderCardProps {
  stakeholder: StakeholderWithOrg
  onEdit: (s: StakeholderWithOrg) => void
  onRefresh: () => void
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

function relativeTime(date: Date | null | string): string | null {
  if (!date) return null
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const days  = Math.floor(diff / 86_400_000)
  const hours = Math.floor(diff / 3_600_000)
  if (days === 0 && hours === 0) return 'hace un momento'
  if (days === 0) return `hace ${hours}h`
  if (days === 1) return 'ayer'
  if (days < 30)  return `hace ${days} días`
  const months = Math.floor(days / 30)
  return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`
}

function formalityLabel(level: number) {
  if (level < 25)  return 'Muy informal'
  if (level < 50)  return 'Informal'
  if (level < 75)  return 'Formal'
  return 'Muy formal'
}

const AVATAR_COLORS = [
  '#185FA5', '#7C3AED', '#059669', '#D97706',
  '#DC2626', '#0891B2', '#9333EA', '#16A34A',
]

function avatarColor(name: string) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function StakeholderCard({ stakeholder, onEdit, onRefresh }: StakeholderCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`¿Eliminar a "${stakeholder.name}"?`)) return
    setLoading(true)
    await fetch(`/api/stakeholders/${stakeholder.id}`, { method: 'DELETE' })
    onRefresh()
    setLoading(false)
  }

  const bgColor = avatarColor(stakeholder.name)
  const lastContact = relativeTime(stakeholder.lastContactAt)

  return (
    <div className="rounded-lg bg-card border border-border p-4 flex flex-col gap-3">
      {/* Header: avatar + name/role + actions */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-semibold"
          style={{ backgroundColor: bgColor }}
        >
          {initials(stakeholder.name)}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug truncate">{stakeholder.name}</p>
          {stakeholder.role && (
            <p className="text-xs text-muted-foreground truncate">{stakeholder.role}</p>
          )}
          <div className="mt-1">
            <OrgBadge name={stakeholder.organization.name} color={stakeholder.organization.color} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 cursor-pointer"
            onClick={() => onEdit(stakeholder)}
            disabled={loading}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 cursor-pointer text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Formality bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Formalidad</span>
          <span className="text-xs text-muted-foreground">{formalityLabel(stakeholder.formalityLevel)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              stakeholder.formalityLevel >= 75 ? 'bg-primary' :
              stakeholder.formalityLevel >= 50 ? 'bg-blue-500' :
              stakeholder.formalityLevel >= 25 ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            style={{ width: `${stakeholder.formalityLevel}%` }}
          />
        </div>
      </div>

      {/* Communication style tags */}
      {stakeholder.communicationStyle.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {stakeholder.communicationStyle.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer: email + last contact */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
        <span className="truncate">{stakeholder.email ?? '—'}</span>
        {lastContact && <span className="shrink-0 ml-2">{lastContact}</span>}
      </div>
    </div>
  )
}
