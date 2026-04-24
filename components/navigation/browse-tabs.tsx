import type { BrowseViewMode } from "@/types/navigation";
import { BROWSE_VIEW_LABELS } from "@/lib/navigation";

const TABS: BrowseViewMode[] = ["all", "live", "fixtures", "results"];

export function BrowseTabs({
  value,
  onChange,
}: {
  value: BrowseViewMode;
  onChange: (next: BrowseViewMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Browse mode"
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {TABS.map((tab) => {
        const active = value === tab;
        return (
          <button
            key={tab}
            role="tab"
            type="button"
            onClick={() => onChange(tab)}
            aria-selected={active}
            aria-pressed={active}
            className={[
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "bg-white/5 text-foreground/75 hover:bg-white/10",
            ].join(" ")}
          >
            {BROWSE_VIEW_LABELS[tab]}
          </button>
        );
      })}
    </div>
  );
}
