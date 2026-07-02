'use client'

import { useState } from 'react'
import { Check, Trash2, Pencil, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommitmentStatusBadge } from '@/components/shared/commitment-status-badge'
import { OrgBadge } from '@/components/shared/org-badge'
import { EmailDraftSheet } from '@/components/artifacts/email-draft-sheet'
import { formatDate } from '@/lib/utils'
import type { CommitmentWithStakeholder } from '@/types'

interface CommitmentCardProps {
  commitment: CommitmentWithStakeholder
  onEdit: (c: CommitmentWithStakeholder) => void
  onRefresh: () => void
}

export function CommitmentCard({ commitment, onEdit, onRefresh }: CommitmentCardProps) {
  const [loading,    setLoading]    = useState(false)
  const [emailSheet, setEmailSheet] = useState(false)

  async function markFulfilled() {
    setLoading(true)
    await fetch(`/api/commitments/${commitment.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: 'FULFILLED' }),
    })
    onRefresh()
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${commitment.title}"?`)) return
    setLoading(true)
    await fetch(`/api/commitments/${commitment.id}`, { method: 'DELETE' })
    onRefresh()
    setLoading(false)
  }

  const isOverdue   = commitment.status === 'OVERDUE'
  const isFulfilled = commitment.status === 'FULFILLED'

  return (
    <div className="rounded-lg bg-card border border-border px-4 py-3 flex items-start gap-3">
      {/* Left: title + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <CommitmentStatusBadge status={commitment.status} />
          {commitment.dueDate && (
            <span className={`text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              {formatDate(commitment.dueDate)}
            </span>
          )}
        </div>

        <p className="text-sm font-medium leading-snug">{commitment.title}</p>

        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground">{commitment.stakeholder.name}</span>
          {commitment.stakeholder.role && (
            <span className="text-xs text-muted-foreground">· {commitment.stakeholder.role}</span>
          )}
          <OrgBadge
            name={commitment.stakeholder.organization.name}
            color={commitment.stakeholder.organization.color}
          />
        </div>

        {commitment.item && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            Relacionado con: {commitment.item.title}
          </p>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!isFulfilled && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 cursor-pointer"
            disabled={loading}
            onClick={markFulfilled}
          >
            <Check className="w-3 h-3" />
            Cumplido
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 cursor-pointer"
          title="Redactar email"
          onClick={() => setEmailSheet(true)}
          disabled={loading}
        >
          <Mail className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 cursor-pointer"
          onClick={() => onEdit(commitment)}
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

      <EmailDraftSheet
        open={emailSheet}
        onClose={() => setEmailSheet(false)}
        context={commitment.title}
        commitmentId={commitment.id}
        stakeholderId={commitment.stakeholderId}
      />
    </div>
  )
}
