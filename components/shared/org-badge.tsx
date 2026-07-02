export function OrgBadge({ name, color }: { name: string; color: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {name}
    </span>
  )
}
