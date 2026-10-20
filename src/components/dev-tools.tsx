"use client"

import { useState } from "react"
import { WrenchIcon, XIcon } from "lucide-react"
import { HeaderAccounts } from "@/components/header-accounts"
import { PremiumToggle } from "@/components/premium-toggle"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Demo tools, out of the way: a black oval button at the bottom centre of the page opens a black bar with
 * the demo accounts and, for job seekers, the Premium crown.
 */
export function DevTools({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false)

  return (
    // "dark" so the accounts and crown use the dark colours on the black bar
    <div dir="ltr" className="dark fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {open && (
        <div className="flex items-center gap-3 rounded-full bg-black px-5 py-2.5 text-white shadow-2xl ring-1 ring-white/10">
          <HeaderAccounts />
          {user?.role === "SEEKER" && (
            <>
              <span className="h-8 w-px bg-white/15" aria-hidden />
              <PremiumToggle user={user} />
            </>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Dev tools"
        className={cn(
          "flex h-10 items-center gap-2 rounded-full bg-black px-5 text-sm font-medium text-white shadow-xl ring-1 ring-white/10 transition hover:bg-neutral-800"
        )}
      >
        {open ? <XIcon className="size-4" /> : <WrenchIcon className="size-4" />}
        Dev tools
      </button>
    </div>
  )
}
