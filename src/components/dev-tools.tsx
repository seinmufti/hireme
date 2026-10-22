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
  return (
    <>
      <PhoneDevTools user={user} />
      <DesktopDevTools user={user} />
    </>
  )
}

/**
 * Phones and tablets (no hover, no room for the long bar): a round wrench above the tab bar that opens
 * a panel with the accounts in a grid and the Premium crown. Tapping outside, or picking an account, closes it.
 */
function PhoneDevTools({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false)
  return (
    <div dir="ltr" className="dark lg:hidden">
      {open && <button type="button" aria-label="Close dev tools" className="fixed inset-0 z-50 cursor-default" onClick={() => setOpen(false)} />}
      {open && (
        <div className="fixed inset-x-2 bottom-[calc(12.25rem+env(safe-area-inset-bottom))] z-50 max-h-[60dvh] space-y-4 overflow-y-auto rounded-2xl bg-black p-4 text-white shadow-2xl ring-1 ring-white/10">
          <HeaderAccounts stacked onPicked={() => setOpen(false)} />
          {user?.role === "SEEKER" && (
            <div className="flex items-center justify-between border-t border-white/15 pt-3">
              <span className="text-xs font-medium tracking-wide text-white/50 uppercase">Premium</span>
              <PremiumToggle user={user} />
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Dev tools"
        // Phones: on the left edge, above pinned bars (e.g. a job's Apply bar) so it never covers a button
        className={cn(
          "fixed bottom-[calc(9rem+env(safe-area-inset-bottom))] left-3 z-50 flex size-11 items-center justify-center rounded-full bg-black text-white shadow-2xl ring-1 ring-white/10",
          open && "bg-neutral-800"
        )}
      >
        <WrenchIcon className="size-4" />
      </button>
    </div>
  )
}

/** Laptops and desktops: the black oval described above. */
function DesktopDevTools({ user }: { user: User | null }) {
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
    // "dark" so the accounts and crown use the dark colours on black. w-max: centred with left-1/2, it would
    // otherwise be squeezed into the right half of the screen and cut off the last account types
    <div
      ref={root}
      dir="ltr"
      onMouseEnter={() => {
        stopClosing()
        setHovered(true)
      }}
      onMouseLeave={closeSoon}
      className="dark fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 z-50 hidden h-14 w-max max-w-[calc(100vw-2rem)] lg:flex -translate-x-1/2 items-center rounded-full bg-black ps-1.5 pe-4 text-white shadow-2xl ring-1 ring-white/10"
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
            tools fade in a little after the oval starts growing (no slide of their own, so they move only with the oval). Not reachable while folded away. */}
        <div
          inert={!open}
          className={cn(
            "overflow-hidden transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "opacity-100 delay-100" : "opacity-0"
          )}
        >
          {/* Full width from the start (w-max), so the bar only uncovers it: nothing inside squeezes and shifts while it grows */}
          <div className="flex w-max items-center gap-3">
            <span className="ms-2 h-7 w-px shrink-0 bg-white/15" aria-hidden />
            {/* The crown first, next to the wrench: toasts pop up at the bottom right, over the bar's far end */}
            {user?.role === "SEEKER" && (
              <>
                <PremiumToggle user={user} />
                <span className="h-7 w-px shrink-0 bg-white/15" aria-hidden />
              </>
            )}
            <HeaderAccounts />
          </div>
        </div>
      </div>
    </div>
  )
}
