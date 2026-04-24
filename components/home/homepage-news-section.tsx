"use client";

import Link from "next/link";
import { useHomepageNews } from "@/hooks/use-homepage-news";
import { SmartImage } from "@/components/assets/smart-image";
import { EmptyStateCard } from "@/components/navigation/empty-state-card";
import { ErrorStateCard } from "@/components/navigation/error-state-card";
import { LoadingSkeletonBlock } from "@/components/navigation/loading-skeleton-block";
import { newsHref } from "@/lib/navigation";
import { triggerHaptic } from "@/lib/haptic-feedback";

function NewsCard({
  id,
  title,
  slug,
  imageUrl,
  publishedAt,
  category,
  isBreaking,
}: {
  id: string;
  title: string;
  slug?: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
  category?: string | null;
  isBreaking?: boolean;
}) {
  const timeAgo = publishedAt
    ? (() => {
        const secs = Math.floor(
          (Date.now() - new Date(publishedAt).getTime()) / 1000
        );
        if (secs < 60) return `${secs}s ago`;
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
      })()
    : null;

  return (
    <Link
      href={newsHref(slug || id)}
      onClick={() => triggerHaptic("light")}
      className="grid grid-cols-[72px_1fr] gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary/40 active:scale-[0.98]"
    >
      <SmartImage
        kind="article_image"
        src={imageUrl}
        alt={title}
        fallbackLabel={category || "News"}
        className="h-[72px] w-[72px] rounded-xl object-cover"
      />
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isBreaking && (
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
              Breaking
            </span>
          )}
          {category && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {category}
            </span>
          )}
        </div>
        <p className="text-sm font-medium leading-snug text-foreground line-clamp-2">
          {title}
        </p>
        {timeAgo && (
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        )}
      </div>
    </Link>
  );
}

export function HomepageNewsSection({
  titleOverride,
}: {
  /** Operator-supplied title override from the control plane. */
  titleOverride?: string | null;
}) {
  const { data, isLoading, error } = useHomepageNews();

  return (
    // border-b is owned by HomeModuleShell — do not add it here
    <div className="px-3 py-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{titleOverride ?? "Latest News"}</h2>
        <Link
          href="/news"
          className="text-xs text-primary hover:underline"
        >
          See all
        </Link>
      </div>

      {isLoading && <LoadingSkeletonBlock lines={3} />}

      {!isLoading && error && (
        <ErrorStateCard
          title="News unavailable"
          body="Could not load the latest news right now."
        />
      )}

      {!isLoading && !error && !data?.items?.length && (
        <EmptyStateCard
          title="No news yet"
          body="There is no homepage news available right now. Check back soon."
        />
      )}

      {!isLoading && !error && !!data?.items?.length && (
        <div className="grid gap-2">
          {data.items.slice(0, 4).map((item) => (
            <NewsCard key={item.id} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}
