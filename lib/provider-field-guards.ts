// lib/provider-field-guards.ts
// Section 08 — Provider field access guards.
//
// All provider-specific field access MUST go through these helpers in DTO
// builders and normalizers. UI components and generic rendering code must
// never read raw provider field names like strBadge, strLeague, idTeam, etc.
//
// Rules:
//   - Never throw — always return { value: null, field: null } on miss
//   - Inspect multiple field name variants in priority order
//   - The field name that resolved is returned alongside the value for tracing

import { toNullableString } from "@/lib/validation";

// ── String field guard ────────────────────────────────────────────────────

/**
 * Read the first non-empty string value from any of the given field names.
 * Returns both the value and the winning field name for debug tracing.
 */
export function readStringField(
  raw: unknown,
  fields: string[],
): { value: string | null; field: string | null } {
  const obj = raw as Record<string, unknown> | null | undefined;
  if (!obj || typeof obj !== "object") return { value: null, field: null };
  for (const field of fields) {
    const value = toNullableString(obj[field]);
    if (value) return { value, field };
  }
  return { value: null, field: null };
}

// ── Number field guard ────────────────────────────────────────────────────

/**
 * Read the first finite number from any of the given field names.
 * String-numeric values are coerced (e.g. "42" → 42).
 */
export function readNumberField(
  raw: unknown,
  fields: string[],
): { value: number | null; field: string | null } {
  const obj = raw as Record<string, unknown> | null | undefined;
  if (!obj || typeof obj !== "object") return { value: null, field: null };
  for (const field of fields) {
    const raw = obj[field];
    if (raw == null) continue;
    const n = Number(raw);
    if (Number.isFinite(n)) return { value: n, field };
  }
  return { value: null, field: null };
}

// ── Boolean field guard ───────────────────────────────────────────────────

/**
 * Read the first boolean-like value from any of the given field names.
 * Coerces "true" / "1" / 1 → true; "false" / "0" / 0 → false.
 */
export function readBooleanField(
  raw: unknown,
  fields: string[],
): { value: boolean | null; field: string | null } {
  const obj = raw as Record<string, unknown> | null | undefined;
  if (!obj || typeof obj !== "object") return { value: null, field: null };
  for (const field of fields) {
    const v = obj[field];
    if (v == null) continue;
    if (typeof v === "boolean") return { value: v, field };
    if (v === 1 || v === "1" || v === "true") return { value: true, field };
    if (v === 0 || v === "0" || v === "false") return { value: false, field };
  }
  return { value: null, field: null };
}
