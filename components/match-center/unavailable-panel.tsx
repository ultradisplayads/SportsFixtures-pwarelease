import { cn } from "@/lib/utils"

interface UnavailablePanelProps {
  title?: string
  message?: string
  className?: string
}

export function UnavailablePanel({
  title = "Not available",
  message,
  className,
}: UnavailablePanelProps) {
  return (
    <div className={cn("p-4", className)}>
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {message && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  )
}
