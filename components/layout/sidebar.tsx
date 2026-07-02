'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutList,
  Mic,
  Handshake,
  Users,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard/items',        label: 'Items',          icon: LayoutList },
  { href: '/dashboard/narrate',      label: 'Narrate',        icon: Mic        },
  { href: '/dashboard/commitments',  label: 'Commitments',    icon: Handshake  },
  { href: '/dashboard/stakeholders', label: 'Stakeholders',   icon: Users      },
  { href: '/dashboard/meetings',     label: 'Meetings',       icon: Calendar   },
  { href: '/dashboard/settings',     label: 'Settings',       icon: Settings   },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-r border-border bg-card transition-all duration-200 shrink-0',
        collapsed ? 'w-14' : 'w-52'
      )}
    >
      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors cursor-pointer',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-4">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <><ChevronLeft className="w-4 h-4 mr-2" /><span className="text-xs">Collapse</span></>
          }
        </button>
      </div>
    </aside>
  )
}
