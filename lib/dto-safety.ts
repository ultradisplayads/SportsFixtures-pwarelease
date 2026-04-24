// lib/dto-safety.ts
// Section 08 — DTO warning collection and safety checks.
//
// Collects ContractWarning entries for a DTO before it is wrapped in an
// envelope.  Used by DTO builders and API route handlers to surface data
// quality issues without crashing or hiding them.
//
// Rules:
//   - Never throw — always return a (possibly empty) array
//   - Missing id and name are always warnings
//   - Missing asset candidates per asset slot are always warnings
//   - Callers attach the result to the NormalizedEnvelope.warnings field

import type { ContractWarning } from "@/types/contracts";
import type { NormalizedAssetSet } from "@/types/assets";
import { hasUsableAsset } from "@/lib/asset-audit";

// ── Core collector ────────────────────────────────────────────────────────

/**
 * Collect ContractWarning entries for a generic DTO before envelope creation.
 *
 * @param input.id        The DTO's stable identifier — warns if missing
 * @param input.name      The DTO's display name — warns if missing
 * @param input.assetSets Named asset slots to check for usable URLs
 */
export function collectDtoWarnings(input: {
  id?: string | null;
  name?: string | null;
  assetSets?: Array<{ field: string; value: NormalizedAssetSet | null | undefined }>;
}): ContractWarning[] {
  const warnings: ContractWarning[] = [];

  if (!input.id) {
    warnings.push({
      code: "missing_id",
      message: "DTO is missing a stable id — deduplication and linking may break.",
    });
  }

  if (!input.name) {
    warnings.push({
      code: "missing_name",
      message: "DTO is missing a display name — fallback badge will render empty.",
    });
  }

  for (const asset of input.assetSets ?? []) {
    if (!hasUsableAsset(asset.value)) {
      warnings.push({
        code: "missing_asset",
        message: `No usable asset candidates for "${asset.field}" — fallback badge/rect will render.`,
        field: asset.field,
      });
    }
  }

  return warnings;
}

// ── Named asset slot helper ───────────────────────────────────────────────

/** Convenience: build a named asset slot entry for collectDtoWarnings. */
export function assetSlot(
  field: string,
  value: NormalizedAssetSet | null | undefined,
): { field: string; value: NormalizedAssetSet | null | undefined } {
  return { field, value };
}
