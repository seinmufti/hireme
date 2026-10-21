"use client"

import type { ComponentType } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

/** The link for the current page: the longest match, so /jobs/applied lights up Applications, not Jobs. */
export const activeHref = (pathname: string, links: NavLink[]) =>
  links
    .filter((l) => pathname === l.href || pathname.startsWith(l.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

export type NavLink = { href: string; label: string; icon: ComponentType<{ className?: string }>; badge?: number }

/** Laptops and desktops: the links along the top. Smaller screens get them at the bottom (BottomNav). */
export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname()
  return (
    <nav className="flex h-full items-stretch gap-1">
      {links.map((l) => {
        const active = l.href === activeHref(pathname, links)
        return (
          <Link
            key={l.href}
            href={l.href}
            // The whole page loads in the background, so switching tabs is instant
            prefetch
            className={cn(
              "flex items-center gap-2 border-b-2 px-3 whitespace-nowrap text-sm font-medium transition-colors",
              active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {l.label}
            {!!l.badge && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none font-semibold text-primary-foreground">
                {l.badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
