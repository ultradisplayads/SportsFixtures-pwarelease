"use client"

import { Home, Radio, Calendar, Tv, Star } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

const navItems = [
  { id: "home",      icon: Home,     label: "Home",      href: "/"           },
  { id: "live",      icon: Radio,    label: "Live",      href: "/live", badge: 2 },
  { id: "fixtures",  icon: Calendar, label: "Fixtures",  href: "/fixtures"   },
  { id: "tv",        icon: Tv,       label: "TV",        href: "/tv"         },
  { id: "favourites",icon: Star,     label: "Saved",     href: "/favourites" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-screen-sm items-center justify-around md:max-w-screen-md">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 py-2.5 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && (
                  <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-live text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="max-w-full truncate text-[11px] font-medium leading-tight sm:text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
