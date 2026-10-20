"use client"

import Link from "next/link"
import { HeaderAccounts } from "@/components/header-accounts"
import { Logo } from "@/components/logo"
import { NavLinks } from "@/components/nav-links"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { StoreGate } from "@/components/store-gate"
import { unreadCountFor, useCurrentUser, useStore } from "@/lib/store"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreGate>
      <Shell>{children}</Shell>
    </StoreGate>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser()
  const unread = useStore((s) => (user && user.role !== "RECRUITER" ? unreadCountFor(s, user.id) : 0))
  const role = user?.role

  const pool = { href: "/pool", label: "The Pool" }
  const inbox = { href: "/inbox", label: "Inbox", badge: unread }
  const profile = { href: "/profile", label: "Profile" }
  const jobs = { href: "/jobs", label: role === "EMPLOYER" ? "Jobs" : "Find jobs" }
  const companies = { href: "/companies", label: "Companies" }
  const links =
    role === "EMPLOYER"
      ? [profile, pool, jobs, companies, inbox]
      : role === "RECRUITER"
        ? [profile, pool, jobs, companies]
        : role === "SEEKER"
          ? [profile, jobs, companies, inbox]
          : []

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-8">
          <div className="flex h-full items-center gap-6">
            {/* The logo goes back to the account picker, where you can switch or create accounts */}
            <Link href="/login" title="Switch or create an account" className="flex shrink-0 items-center gap-2.5">
              <Logo size={34} />
              <span className="text-lg font-semibold tracking-tight">HireMe</span>
            </Link>
            <NavLinks links={links} />
          </div>

          <div className="flex items-center gap-4">
            <HeaderAccounts />
            {/* Job seekers hear about new jobs that match them; on the right, with the other actions */}
            {role === "SEEKER" && <NotificationBell />}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-8 py-8">{children}</main>
    </>
  )
}
