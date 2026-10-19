"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function NavLinks({ links }: { links: { href: string; label: string; badge?: number }[] }) {
  const pathname = usePathname()
  return (
    <nav className="flex h-full items-stretch gap-1">
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/")
        return (
          <Link
            key={l.href}
            href={l.href}
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
