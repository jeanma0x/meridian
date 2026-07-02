'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Plus, LayoutList, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { ItemList } from '@/components/items/item-list'
import { ItemBoard } from '@/components/items/item-board'
import { ItemForm } from '@/components/items/item-form'
import { cn } from '@/lib/utils'
import type { ItemWithOrg } from '@/types'

function ItemsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
      ))}
    </div>
  )
}

function ItemsContent() {
  const router     = useRouter()
  const pathname   = usePathname()
  const searchParams = useSearchParams()

  const orgSlug = searchParams.get('org') ?? undefined
  const view    = (searchParams.get('view') ?? 'list') as 'list' | 'board'

  const [items,      setItems]      = useState<ItemWithOrg[]>([])
  const [loading,    setLoading]    = useState(true)
  const [sheetOpen,  setSheetOpen]  = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/items')
      const data = await res.json()
      if (!Array.isArray(data)) return

      // Filter client-side by org slug — API uses orgId but URL stores slug
      const filtered = orgSlug
        ? data.filter((item: ItemWithOrg) => item.organization.slug === orgSlug)
        : data

      setItems(filtered)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [orgSlug])

  useEffect(() => { fetchItems() }, [fetchItems])

  function setView(v: 'list' | 'board') {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', v)
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleItemCreated() {
    setSheetOpen(false)
    fetchItems()
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">

        {/* View toggle */}
        <div className="flex items-center rounded-md border border-border p-0.5 bg-muted/40">
          {(['list', 'board'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer',
                view === v
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v === 'list'
                ? <LayoutList  className="w-3.5 h-3.5" />
                : <LayoutGrid  className="w-3.5 h-3.5" />}
              {v === 'list' ? 'Lista' : 'Board'}
            </button>
          ))}
        </div>

        {/* Add item */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button size="sm" className="gap-1.5" />}>
            <Plus className="w-4 h-4" />
            Agregar
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Nuevo item</SheetTitle>
            </SheetHeader>
            <ItemForm
              onSuccess={handleItemCreated}
              onCancel={() => setSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Content */}
      {loading ? (
        <ItemsSkeleton />
      ) : view === 'list' ? (
        <ItemList  items={items} onRefresh={fetchItems} />
      ) : (
        <ItemBoard items={items} onRefresh={fetchItems} />
      )}
    </div>
  )
}

export default function ItemsPage() {
  return (
    <Suspense fallback={<ItemsSkeleton />}>
      <ItemsContent />
    </Suspense>
  )
}
