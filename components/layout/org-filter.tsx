'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Org = {
  id: string
  name: string
  slug: string
  color: string
}

export function OrgFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSlug = searchParams.get('org') ?? 'all'

  const [orgs, setOrgs] = useState<Org[]>([])

  useEffect(() => {
    fetch('/api/organizations')
      .then(r => r.json())
      .then(data => Array.isArray(data) && setOrgs(data))
      .catch(() => {})
  }, [])

  function select(slug: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug === 'all') {
      params.delete('org')
    } else {
      params.set('org', slug)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
      <Pill label="All" active={activeSlug === 'all'} onClick={() => select('all')} />
      {orgs.map(org => (
        <Pill
          key={org.id}
          label={org.name}
          active={activeSlug === org.slug}
          color={org.color}
          onClick={() => select(org.slug)}
        />
      ))}
    </div>
  )
}

function Pill({
  label,
  active,
  color,
  onClick,
}: {
  label: string
  active: boolean
  color?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
        active
          ? 'bg-foreground text-background'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      )}
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </button>
  )
}
