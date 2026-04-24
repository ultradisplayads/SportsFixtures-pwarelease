import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PartialDataNoteProps {
  message?: string
  className?: string
}

export function PartialDataNote({ message, className }: PartialDataNoteProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300",
        className
      )}
    >
      <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
      <span>
        {message ?? "Some details are not currently available for this event."}
      </span>
    </div>
  )
}
