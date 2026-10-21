"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { NavLink } from "@/components/nav-links"
import { cn } from "@/lib/utils"

/** Phones and tablets: the navbar's links as a tab bar along the bottom of the screen, like most job apps. */
export function BottomNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname()
  if (!links.length) return null
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid border-t bg-card/95 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] backdrop-blur lg:hidden"
      style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
    >
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/")
        return (
          <Link
            key={l.href}
            href={l.href}
            // The whole page loads in the background, so switching tabs is instant
            prefetch
            className={cn(
              "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="relative">
              <l.icon className="size-5" />
              {!!l.badge && (
                <span className="absolute -top-1.5 -end-2.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 font-semibold text-primary-foreground">
                  {l.badge > 9 ? "9+" : l.badge}
                </span>
              )}
            </span>
            <span className="max-w-full truncate px-1">{l.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
