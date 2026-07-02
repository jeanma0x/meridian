'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { Bell, AlertTriangle, Clock, TrendingUp, AlertCircle, Check, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrgFilter } from './org-filter'
import type { NotificationType } from '@/lib/generated/prisma/client'

type Notification = {
  id:        string
  type:      NotificationType
  message:   string
  read:      boolean
  createdAt: string
}

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  DEAD_ZONE:        <Clock        className="w-3.5 h-3.5 text-muted-foreground" />,
  COMMITMENT_DUE:   <AlertCircle  className="w-3.5 h-3.5 text-amber-500"        />,
  ESCALATION_RISK:  <TrendingUp   className="w-3.5 h-3.5 text-orange-500"       />,
  OVERDUE:          <AlertTriangle className="w-3.5 h-3.5 text-destructive"     />,
  SYNC_ERROR:       <AlertCircle  className="w-3.5 h-3.5 text-destructive"      />,
}

function relativeTime(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'ahora'
  if (mins  < 60) return `hace ${mins}m`
  if (hours < 24) return `hace ${hours}h`
  return `hace ${days}d`
}

function NotificationBell() {
  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    try {
      const res  = await fetch('/api/notifications')
      const data = await res.json()
      if (Array.isArray(data)) setNotifications(data)
    } catch {}
  }

  useEffect(() => { fetchNotifications() }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function markOne(id: string) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAll() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unread = notifications.filter(n => !n.read).length

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(v => !v); if (!open) fetchNotifications() }}
        className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 rounded-lg bg-popover border border-border shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-sm font-medium">Notificaciones</span>
            {unread > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs gap-1 cursor-pointer"
                onClick={markAll}
              >
                <CheckCheck className="w-3 h-3" />
                Marcar todas
              </Button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Sin notificaciones</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-border/50 last:border-0 ${n.read ? 'opacity-60' : 'bg-primary/5'}`}
                >
                  <div className="mt-0.5 shrink-0">{TYPE_ICON[n.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{relativeTime(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markOne(n.id)}
                      className="shrink-0 mt-0.5 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Marcar como leída"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function TopBar() {
  return (
    <header className="h-12 flex items-center gap-4 px-4 border-b border-border bg-card shrink-0">
      {/* Logo */}
      <span className="text-sm font-semibold tracking-tight text-foreground select-none w-36 shrink-0">
        Meridian
      </span>

      {/* Org filter */}
      <div className="flex-1 min-w-0">
        <Suspense fallback={<div className="h-6 w-48 rounded-full bg-muted animate-pulse" />}>
          <OrgFilter />
        </Suspense>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 shrink-0">
        <NotificationBell />
      </div>
    </header>
  )
}
