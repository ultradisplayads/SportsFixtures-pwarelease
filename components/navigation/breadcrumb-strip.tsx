import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BreadcrumbItem } from "@/types/navigation";

export function BreadcrumbStrip({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 overflow-x-auto">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1 shrink-0">
            {i > 0 && (
              <ChevronRight className="h-3 w-3 shrink-0 text-foreground/30" aria-hidden="true" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-xs text-foreground/60 hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`text-xs ${isLast ? "font-medium text-foreground" : "text-foreground/60"}`}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
