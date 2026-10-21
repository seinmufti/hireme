"use client"

import { useState } from "react"
import { WrenchIcon } from "lucide-react"
import { HeaderAccounts } from "@/components/header-accounts"
import { PremiumToggle } from "@/components/premium-toggle"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Demo tools, out of the way: a black oval at the bottom centre of the page. Clicking the wrench opens it
 * to show the demo accounts and, for job seekers, the Premium crown; clicking it again folds it back.
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
        <div className="fixed inset-x-2 bottom-[calc(8.25rem+env(safe-area-inset-bottom))] z-50 max-h-[60dvh] space-y-4 overflow-y-auto rounded-2xl bg-black p-4 text-white shadow-2xl ring-1 ring-white/10">
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
        className={cn(
          "fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex size-11 -translate-x-1/2 items-center justify-center rounded-full bg-black text-white shadow-2xl ring-1 ring-white/10",
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
  const [open, setOpen] = useState(false)

  return (
    // "dark" so the accounts and crown use the dark colours on black. w-max: centred with left-1/2, it would
    // otherwise be squeezed into the right half of the screen and cut off the last account types
    <div
      dir="ltr"
      className="dark fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 z-50 hidden h-14 w-max max-w-[calc(100vw-2rem)] lg:flex -translate-x-1/2 items-center rounded-full bg-black ps-1.5 pe-4 text-white shadow-2xl ring-1 ring-white/10"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Dev tools"
        className={cn("flex size-9 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10", open && "bg-white/15")}
      >
        <WrenchIcon className="size-4" />
      </button>
      {open ? (
        <div className="flex items-center gap-3">
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
      ) : (
        <span className="ps-1 text-sm font-medium whitespace-nowrap">Dev tools</span>
      )}
    </div>
  )
}
