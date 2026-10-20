"use client"

import { useEffect, useRef, useState } from "react"
import { WrenchIcon } from "lucide-react"
import { HeaderAccounts } from "@/components/header-accounts"
import { PremiumToggle } from "@/components/premium-toggle"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Demo tools, out of the way: a black oval at the bottom centre of the page. Hovering it makes the oval
 * itself grow sideways to show the demo accounts and, for job seekers, the Premium crown; it shrinks back
 * shortly after the pointer leaves. Clicking the wrench keeps it open (or lets it close).
 */
export function DevTools({ user }: { user: User | null }) {
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const closing = useRef<ReturnType<typeof setTimeout> | null>(null)
  const open = hovered || pinned

  const stopClosing = () => {
    if (closing.current) clearTimeout(closing.current)
    closing.current = null
  }
  // Leaving it: shrink a moment later, but not while one of its dropdowns ("+N more") is open,
  // since that list sits outside the oval
  const closeSoon = () => {
    stopClosing()
    closing.current = setTimeout(function check() {
      if (root.current?.querySelector("[data-popup-open]")) closing.current = setTimeout(check, 300)
      else setHovered(false)
    }, 300)
  }
  useEffect(() => stopClosing, [])

  return (
    // "dark" so the accounts and crown use the dark colours on black
    <div
      ref={root}
      dir="ltr"
      onMouseEnter={() => {
        stopClosing()
        setHovered(true)
      }}
      onMouseLeave={closeSoon}
      className="dark fixed bottom-5 left-1/2 z-50 flex h-12 -translate-x-1/2 items-center rounded-full bg-black ps-1.5 pe-4 text-white shadow-2xl ring-1 ring-white/10"
    >
      <button
        type="button"
        onClick={() => setPinned((v) => !v)}
        aria-expanded={open}
        aria-pressed={pinned}
        aria-label="Dev tools"
        title={pinned ? "Unpin" : "Keep open"}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10",
          pinned && "bg-white/15"
        )}
      >
        <WrenchIcon className="size-4" />
      </button>
      {/* Collapsed: the label. Open: the tools, sliding out from the oval itself */}
      {/* Both parts change width on the same slow, soft curve, so the oval grows and shrinks in one motion */}
      <span
        className={cn(
          "grid transition-[grid-template-columns,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "grid-cols-[0fr] opacity-0" : "grid-cols-[1fr] opacity-100"
        )}
      >
        <span className="overflow-hidden ps-1 text-sm font-medium whitespace-nowrap">Dev tools</span>
      </span>
      <div
        className={cn(
          "grid transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "grid-cols-[1fr]" : "grid-cols-[0fr]"
        )}
      >
        {/* Always clipped (its dropdowns and tooltips open outside it), so nothing pops in mid-animation; the
            tools fade and slide in a little after the oval starts growing. Not reachable while folded away. */}
        <div
          inert={!open}
          className={cn(
            "flex items-center gap-3 overflow-hidden transition-[opacity,translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-x-0 opacity-100 delay-100" : "-translate-x-3 opacity-0"
          )}
        >
          <span className="ms-2 h-7 w-px shrink-0 bg-white/15" aria-hidden />
          <HeaderAccounts />
          {user?.role === "SEEKER" && (
            <>
              <span className="h-7 w-px shrink-0 bg-white/15" aria-hidden />
              <PremiumToggle user={user} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
