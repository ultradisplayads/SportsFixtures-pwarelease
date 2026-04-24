export type HomeModuleKey =
  | "hero"
  | "live_now"
  | "upcoming_fixtures"
  | "latest_results"
  | "recommended_matches"
  | "homepage_news"
  | "nearby_venues"
  | "followed_venues"
  | "featured_competitions"
  | "sports_shortcuts"
  | "leaderboard"
  | "premium_cta";

export type BrowseViewMode = "all" | "live" | "fixtures" | "results";

// AssetKind and AssetResolutionResult now live in types/assets.ts.
// Re-exported here so existing importers do not need to update their paths.
export type { AssetKind, AssetResolutionResult } from "@/types/assets";

export type BrowseFilterState = {
  view: BrowseViewMode;
  sport?: string | null;
  country?: string | null;
  competitionId?: string | null;
  date?: string | null;
  teamId?: string | null;
  followedOnly?: boolean;
  liveOnly?: boolean;
  hasTvOnly?: boolean;
};

export type HomepageNewsEnvelope = {
  items: Array<{
    id: string;
    title: string;
    slug?: string;
    imageUrl?: string | null;
    publishedAt?: string | null;
    category?: string | null;
    isBreaking?: boolean;
  }>;
  source: "news" | "editorial" | "mixed";
  generatedAt?: string | null;
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type SectionShellProps = {
  title: string;
  subtitle?: string | null;
  breadcrumbs?: BreadcrumbItem[];
  action?: {
    label: string;
    href: string;
  };
  children: React.ReactNode;
};
