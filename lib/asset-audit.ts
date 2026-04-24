// lib/asset-audit.ts
// Section 08.C — Runtime asset auditing.
//
// Validates that every NormalizedAssetSet the app uses has either:
//   a) a non-empty primary URL, or
//   b) a non-empty fallbackLabel for text-initials rendering.
//
// The audit never throws — it always returns a list of findings.
// Severity:
//   "error"   — no URL and no fallbackLabel: will render a blank badge
//   "warning" — URL present but empty fallbackLabel (can't degrade gracefully)
//   "info"    — asset resolved cleanly (for positive audit entries)

import type { NormalizedAssetSet, AssetKind } from "@/types/assets"
import type { AssetContract } from "@/types/contracts"

// ── Result types ──────────────────────────────────────────────────────────

export type AssetAuditSeverity = "error" | "warning" | "info"

export type AssetAuditFinding = {
  severity: AssetAuditSeverity
  kind: AssetKind | string
  code: string
  message: string
  /** The set that produced this finding, for tracing. */
  set: NormalizedAssetSet | null
}

export type AssetAuditResult = {
  entityLabel: string
  findings: AssetAuditFinding[]
  hasErrors: boolean
  hasWarnings: boolean
}

// ── Core auditor ──────────────────────────────────────────────────────────

/**
 * Audit a single NormalizedAssetSet and return any findings.
 * Pass `kind` for labeling only — it does not affect audit logic.
 */
export function auditAssetSet(
  set: NormalizedAssetSet | null | undefined,
  kind: AssetKind | string,
): AssetAuditFinding[] {
  if (set == null) {
    return [
      {
        severity: "error",
        kind,
        code: "ASSET_SET_NULL",
        message: `NormalizedAssetSet for "${kind}" is null/undefined — SmartImage will render an empty badge with no label.`,
        set: null,
      },
    ]
  }

  const findings: AssetAuditFinding[] = []
  const hasPrimary = typeof set.primary === "string" && set.primary.trim().length > 0
  const hasFallback = typeof set.fallbackLabel === "string" && set.fallbackLabel.trim().length > 0

  if (!hasPrimary && !hasFallback) {
    findings.push({
      severity: "error",
      kind,
      code: "ASSET_NO_URL_NO_FALLBACK",
      message: `No URL and no fallbackLabel for "${kind}" — badge will be blank.`,
      set,
    })
  } else if (!hasPrimary && hasFallback) {
    findings.push({
      severity: "info",
      kind,
      code: "ASSET_FALLBACK_ONLY",
      message: `No primary URL for "${kind}" — rendering text initials from fallbackLabel "${set.fallbackLabel}".`,
      set,
    })
  } else if (hasPrimary && !hasFallback) {
    findings.push({
      severity: "warning",
      kind,
      code: "ASSET_NO_FALLBACK_LABEL",
      message: `Primary URL present for "${kind}" but no fallbackLabel — if the image fails to load, the badge will be blank.`,
      set,
    })
  } else {
    findings.push({
      severity: "info",
      kind,
      code: "ASSET_OK",
      message: `Asset "${kind}" resolved cleanly.`,
      set,
    })
  }

  return findings
}

/**
 * Audit a full AssetContract (all asset slots on an entity).
 * Returns a single AssetAuditResult aggregating all findings.
 */
export function auditAssetContract(
  contract: AssetContract | null | undefined,
  entityLabel: string,
): AssetAuditResult {
  if (contract == null) {
    return {
      entityLabel,
      findings: [
        {
          severity: "error",
          kind: "contract",
          code: "ASSET_CONTRACT_NULL",
          message: `AssetContract for "${entityLabel}" is null/undefined.`,
          set: null,
        },
      ],
      hasErrors: true,
      hasWarnings: false,
    }
  }

  const findings: AssetAuditFinding[] = [
    ...(contract.badge  ? auditAssetSet(contract.badge,  "team_badge")       : []),
    ...(contract.logo   ? auditAssetSet(contract.logo,   "competition_logo")  : []),
    ...(contract.flag   ? auditAssetSet(contract.flag,   "country_flag")      : []),
    ...(contract.image  ? auditAssetSet(contract.image,  "venue_image")       : []),
    ...(contract.icon   ? auditAssetSet(contract.icon,   "sport_icon")        : []),
  ]

  return {
    entityLabel,
    findings,
    hasErrors:   findings.some((f) => f.severity === "error"),
    hasWarnings: findings.some((f) => f.severity === "warning"),
  }
}

/**
 * Returns true if the asset set has at least one usable URL candidate.
 * Used by dto-safety.ts to detect missing-asset warnings before building envelopes.
 */
export function hasUsableAsset(set: NormalizedAssetSet | null | undefined): boolean {
  if (!set) return false;
  // Check new candidates array first, then fall back to legacy primary/secondary
  if (set.candidates && set.candidates.length > 0) return true;
  return Boolean(set.primary || set.secondary);
}

/**
 * Batch-audit an array of entity objects.
 * Each object must already have its AssetContract resolved.
 */
export function auditAssetBatch(
  items: Array<{ label: string; contract: AssetContract | null | undefined }>,
): AssetAuditResult[] {
  return items.map(({ label, contract }) => auditAssetContract(contract, label))
}
