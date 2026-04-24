// lib/validation.ts
// Central validation primitives used by service layer, API routes, and
// normalization helpers.  No UI logic here.
//
// Rules:
//  - empty string, undefined, null, and whitespace-only string are all treated
//    as "no value" — callers must not distinguish between them accidentally.
//  - Do not throw from any helper — always return a safe default.

import type { ContractWarning } from "@/types/contracts";

// ── String helpers ────────────────────────────────────────────────────────

/** Returns true only for non-empty, non-whitespace strings. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Returns the trimmed string if valid, otherwise null. */
export function toNullableString(value: unknown): string | null {
  return isNonEmptyString(value) ? (value as string).trim() : null;
}

/** Returns the trimmed string if valid, otherwise the supplied default. */
export function toStringOrDefault(value: unknown, fallback: string): string {
  return isNonEmptyString(value) ? (value as string).trim() : fallback;
}

// ── Array helpers ─────────────────────────────────────────────────────────

/** Always returns a typed array — never throws on null/undefined/non-array. */
export function toSafeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Compact-filters null/undefined/empty-string from an array of strings. */
export function compactStrings(values: Array<string | null | undefined>): string[] {
  return values.filter((v): v is string => isNonEmptyString(v));
}

// ── Number helpers ────────────────────────────────────────────────────────

/** Returns a finite number or null. Coerces string numbers. */
export function toNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ── Boolean helpers ───────────────────────────────────────────────────────

/** Coerces truthy values to a real boolean, defaulting to false. */
export function toBoolean(value: unknown, defaultValue = false): boolean {
  if (value == null) return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "true" || lower === "1" || lower === "yes") return true;
    if (lower === "false" || lower === "0" || lower === "no") return false;
  }
  if (typeof value === "number") return value !== 0;
  return defaultValue;
}

// ── Object helpers ────────────────────────────────────────────────────────

/** Returns the first key in `obj` that has a non-empty string value. */
export function firstNonEmptyField(
  obj: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const v = toNullableString(obj[key]);
    if (v) return v;
  }
  return null;
}

// ── Warning builder ───────────────────────────────────────────────────────

/** Build a typed ContractWarning. Keeps warning construction uniform. */
export function buildWarning(
  code: string,
  message: string,
  field?: string,
): ContractWarning {
  return { code, message, ...(field ? { field } : {}) };
}

/**
 * Push a ContractWarning onto a mutable array.
 * Matches the pushWarning() signature used in dto-safety.ts and dto-builders.ts.
 */
export function pushWarning(
  target: ContractWarning[],
  code: string,
  message: string,
  field?: string | null,
) {
  target.push({ code, message, field: field ?? undefined });
}

/** Returns a finite number or null — never coerces strings. */
export function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// ── Availability classifier (08.D) ───────────────────────────────────────

/**
 * Classify an object's data availability based on which required fields are
 * present and non-empty.
 *
 * - "full"        — all required fields are present
 * - "partial"     — at least one required field is present but not all
 * - "empty"       — no required fields are present but obj is not null
 * - "unavailable" — obj is null/undefined
 *
 * @param obj          The object to inspect
 * @param requiredKeys Fields that must be present for "full" availability
 */
export function classifyObjectAvailability(
  obj: Record<string, unknown> | null | undefined,
  requiredKeys: string[],
): import("@/types/contracts").DataAvailability {
  if (obj == null) return "unavailable";
  if (requiredKeys.length === 0) return "full";
  const present = requiredKeys.filter((k) => isNonEmptyString(obj[k]) || (obj[k] != null && typeof obj[k] !== "string"));
  if (present.length === 0) return "empty";
  if (present.length === requiredKeys.length) return "full";
  return "partial";
}

// ── URL helpers ───────────────────────────────────────────────────────────

/** Returns the URL if it looks like a valid http/https URL, otherwise null. */
export function toNullableUrl(value: unknown): string | null {
  const s = toNullableString(value);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? s : null;
  } catch {
    // Relative paths and malformed URLs are allowed through — only filter
    // obviously non-URL strings (empty was already caught above).
    return s.startsWith("/") ? s : null;
  }
}
