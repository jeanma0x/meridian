import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function generateCustomId(orgSlug: string, count: number): string {
  const prefix = orgSlug.slice(0, 2).toUpperCase()
  return `${prefix}-${String(count).padStart(3, '0')}`
}
