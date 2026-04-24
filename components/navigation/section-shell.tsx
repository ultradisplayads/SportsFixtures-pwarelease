import Link from "next/link";
import { BreadcrumbStrip } from "@/components/navigation/breadcrumb-strip";
import type { SectionShellProps } from "@/types/navigation";

export function SectionShell({
  title,
  subtitle,
  breadcrumbs,
  action,
  children,
}: SectionShellProps) {
  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      {/* Breadcrumbs — only on deeper pages, suppress on mobile when single crumb */}
      {breadcrumbs && breadcrumbs.length > 1 && (
        <BreadcrumbStrip items={breadcrumbs} />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-base font-semibold text-foreground leading-snug text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground text-pretty">{subtitle}</p>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="shrink-0 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
          >
            {action.label}
          </Link>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
