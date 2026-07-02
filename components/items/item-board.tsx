'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ItemCard } from './item-card'
import { EmptyState } from '@/components/shared/empty-state'
import type { ItemWithOrg } from '@/types'
import type { ItemStatus } from '@/lib/generated/prisma/client'

// ─── Column config ────────────────────────────────────────────────────────────

type ColumnDef = {
  id:        string
  title:     string
  statuses:  ItemStatus[]
  dropTo:    ItemStatus
  accent:    string
  accentOver: string
}

const COLUMNS: ColumnDef[] = [
  {
    id:         'blocked',
    title:      'Bloqueado',
    statuses:   ['BLOCKED', 'OVERDUE'],
    dropTo:     'BLOCKED',
    accent:     'bg-destructive/10 border-destructive/20',
    accentOver: 'bg-destructive/20 border-destructive/40 ring-1 ring-destructive/30',
  },
  {
    id:         'in_progress',
    title:      'En curso',
    statuses:   ['IN_PROGRESS'],
    dropTo:     'IN_PROGRESS',
    accent:     'bg-blue-500/10 border-blue-500/20',
    accentOver: 'bg-blue-500/20 border-blue-500/40 ring-1 ring-blue-500/30',
  },
  {
    id:         'pending',
    title:      'Pendiente',
    statuses:   ['TODO', 'PENDING'],
    dropTo:     'TODO',
    accent:     'bg-muted/50 border-border',
    accentOver: 'bg-muted border-primary/40 ring-1 ring-primary/30',
  },
  {
    id:         'done',
    title:      'Listo',
    statuses:   ['DONE'],
    dropTo:     'DONE',
    accent:     'bg-green-500/10 border-green-500/20',
    accentOver: 'bg-green-500/20 border-green-500/40 ring-1 ring-green-500/30',
  },
]

// ─── Draggable card ───────────────────────────────────────────────────────────

function DraggableCard({
  item,
  onRefresh,
}: {
  item: ItemWithOrg
  onRefresh?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   item.id,
    data: { item },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`cursor-grab active:cursor-grabbing touch-none transition-opacity ${isDragging ? 'opacity-40' : 'opacity-100'}`}
    >
      <ItemCard item={item} onRefresh={onRefresh} compact />
    </div>
  )
}

// ─── Droppable column ─────────────────────────────────────────────────────────

function DroppableColumn({
  col,
  items,
  onRefresh,
}: {
  col:       ColumnDef
  items:     ItemWithOrg[]
  onRefresh?: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border p-3 transition-all min-h-[120px] ${isOver ? col.accentOver : col.accent}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {col.title}
        </h3>
        <span className="text-xs text-muted-foreground bg-background/60 rounded-full px-1.5 py-0.5 leading-none">
          {items.length}
        </span>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className={`text-xs text-muted-foreground text-center py-6 transition-opacity ${isOver ? 'opacity-100' : 'opacity-50'}`}>
            {isOver ? 'Soltar aquí' : 'Sin items'}
          </p>
        ) : (
          items.map(item => (
            <DraggableCard key={item.id} item={item} onRefresh={onRefresh} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Board ────────────────────────────────────────────────────────────────────

interface ItemBoardProps {
  items:      ItemWithOrg[]
  onRefresh?: () => void
}

export function ItemBoard({ items: initialItems, onRefresh }: ItemBoardProps) {
  const [items,       setItems]       = useState(initialItems)
  const [activeItem,  setActiveItem]  = useState<ItemWithOrg | null>(null)

  // Sync when parent re-fetches
  if (initialItems !== items && !activeItem) {
    setItems(initialItems)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const nonDone   = items.filter(i => i.status !== 'DONE')
  const allActive = nonDone.length > 0 || items.some(i => i.status === 'DONE')

  if (!allActive && items.length === 0) {
    return (
      <EmptyState
        title="Sin items"
        description="Creá tu primer item para verlo en el board."
      />
    )
  }

  function handleDragStart({ active }: DragStartEvent) {
    const item = items.find(i => i.id === active.id)
    setActiveItem(item ?? null)
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveItem(null)
    if (!over) return

    const col       = COLUMNS.find(c => c.id === over.id)
    const item      = items.find(i => i.id === active.id)
    if (!col || !item || item.status === col.dropTo) return

    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: col.dropTo } : i))

    try {
      await fetch(`/api/items/${item.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: col.dropTo }),
      })
    } catch {
      // Revert on failure
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: item.status } : i))
    }

    onRefresh?.()
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map(col => (
          <DroppableColumn
            key={col.id}
            col={col}
            items={items.filter(i => col.statuses.includes(i.status))}
            onRefresh={onRefresh}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem && (
          <div className="opacity-90 rotate-1 shadow-xl cursor-grabbing">
            <ItemCard item={activeItem} compact />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
