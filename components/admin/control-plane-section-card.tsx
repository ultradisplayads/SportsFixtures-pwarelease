"use client"

// components/admin/control-plane-section-card.tsx
// Section 12 — Scrollable section card used by all admin panel components.
//
// Provides a consistent bordered card with an id anchor for deep-linking
// (e.g. /admin/control-plane#ticker) and a visible section title.

type Props = {
  id: string
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ControlPlaneSectionCard({
  id,
  title,
  description,
  children,
  className = "",
}: Props) {
  return (
    <section
      id={id}
      className={`scroll-mt-16 rounded-xl border border-border bg-card p-5 space-y-4 ${className}`}
    >
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}
