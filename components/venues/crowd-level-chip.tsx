import type { CrowdLevel } from "@/lib/crowd-score"

interface CrowdLevelChipProps {
  level: CrowdLevel
}

const LABEL: Record<NonNullable<CrowdLevel>, string> = {
  "quiet":        "Quiet",
  "getting-busy": "Getting busy",
  "busy":         "Busy",
  "packed":       "Packed",
}

const STYLE: Record<NonNullable<CrowdLevel>, string> = {
  "quiet":        "bg-muted text-muted-foreground",
  "getting-busy": "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  "busy":         "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  "packed":       "bg-red-500/15 text-red-600 dark:text-red-400",
}

/**
 * Shows a crowd-level chip only when a derivable level exists.
 * Returns null when level is null — no real signal available.
 */
export function CrowdLevelChip({ level }: CrowdLevelChipProps) {
  if (!level) return null

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLE[level]}`}
    >
      {LABEL[level]}
    </span>
  )
}
