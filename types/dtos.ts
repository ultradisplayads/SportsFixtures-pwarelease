// types/dtos.ts
// Section 08 — Canonical presentational DTO shapes.
//
// These are the only shapes that generic UI components (cards, rows, grids)
// should ever receive.  Raw provider objects (strBadge, strLeague, idTeam, etc.)
// must not appear in any component that imports from this file.
//
// Every image-bearing field is a NormalizedAssetSet — never a raw string URL.

import type { NormalizedAssetSet } from "@/types/assets";
import type { ContractWarning } from "@/types/contracts";

// ── Team ──────────────────────────────────────────────────────────────────

export type TeamCardDto = {
  id: string;
  name: string;
  shortName?: string | null;
  sport?: string | null;
  country?: string | null;
  competitionId?: string | null;
  badge: NormalizedAssetSet;
  _warnings?: ContractWarning[];
};

// ── Competition / League ──────────────────────────────────────────────────

export type CompetitionCardDto = {
  id: string;
  name: string;
  sport?: string | null;
  country?: string | null;
  season?: string | null;
  logo: NormalizedAssetSet;
  _warnings?: ContractWarning[];
};

// ── Country ───────────────────────────────────────────────────────────────

export type CountryRowDto = {
  id: string;
  name: string;
  code?: string | null;
  flag: NormalizedAssetSet;
  _warnings?: ContractWarning[];
};

// ── Venue ─────────────────────────────────────────────────────────────────

export type VenueCardDto = {
  id: string;
  name: string;
  city?: string | null;
  area?: string | null;
  country?: string | null;
  distanceKm?: number | null;
  capacity?: number | null;
  screenCount?: number | null;
  image: NormalizedAssetSet;
  _warnings?: ContractWarning[];
};

// ── Article / News ────────────────────────────────────────────────────────

export type ArticleCardDto = {
  id: string;
  title: string;
  slug?: string | null;
  publishedAt?: string | null;
  category?: string | null;
  isBreaking?: boolean;
  image: NormalizedAssetSet;
  _warnings?: ContractWarning[];
};

// ── Player ────────────────────────────────────────────────────────────────

export type PlayerCardDto = {
  id: string;
  name: string;
  position?: string | null;
  nationality?: string | null;
  teamId?: string | null;
  avatar: NormalizedAssetSet;
  _warnings?: ContractWarning[];
};
