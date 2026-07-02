'use client'

import { Suspense } from 'react'
import { Bell } from 'lucide-react'
import { OrgFilter } from './org-filter'
import { useEffect, useState } from 'react'

function NotificationBell() {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => Array.isArray(data) && setUnread(data.filter((n: { read: boolean }) => !n.read).length))
      .catch(() => {})
  }, [])

  return (
    <button className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
      <Bell className="w-4 h-4" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
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
