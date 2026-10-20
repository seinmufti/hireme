"use client"

import Link from "next/link"
import { GlobalSearch } from "@/components/global-search"
import { HeaderAccounts } from "@/components/header-accounts"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Logo } from "@/components/logo"
import { NavLinks } from "@/components/nav-links"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { PremiumToggle } from "@/components/premium-toggle"
import { StoreGate } from "@/components/store-gate"
import { useI18n } from "@/i18n/provider"
import { homeFor } from "@/lib/options"
import { unreadCountFor, useCurrentUser, useStore } from "@/lib/store"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreGate>
      <Shell>{children}</Shell>
    </StoreGate>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t, dir } = useI18n()
  const user = useCurrentUser()
  const unread = useStore((s) => (user && user.role !== "RECRUITER" ? unreadCountFor(s, user.id) : 0))
  const role = user?.role

  const home = { href: "/home", label: t("nav.home") }
  const jobs = { href: "/jobs", label: t("nav.jobs") }
  const cv = { href: "/profile/cv", label: t("nav.cvPreview") }
  const companies = { href: "/companies", label: t("nav.companies") }
  const pool = { href: "/pool", label: t("nav.pool") }
  const inbox = { href: "/inbox", label: t("nav.inbox"), badge: unread }
  const profile = { href: "/profile", label: t("nav.profile") }
  const links =
    role === "EMPLOYER"
      ? [pool, jobs, companies, inbox, profile]
      : role === "RECRUITER"
        ? [pool, jobs, companies, profile]
        : role === "SEEKER"
          ? [home, jobs, cv, companies, inbox]
          : []

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
        {/* Demo bar: switch between the demo accounts, and pick the language */}
        <div className="border-b bg-muted/40">
          <div dir="ltr" className="mx-auto flex h-14 w-full max-w-7xl items-center justify-end gap-4 px-8">
            <HeaderAccounts />
            <span className="h-8 w-px bg-border" aria-hidden />
            <LanguageSwitcher />
          </div>
        </div>
        {/* Logo on the far left and the same physical order in every language; the text inside follows the language */}
        <div dir="ltr" className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-8">
          <Link href={role ? homeFor(role) : "/login"} title={t("nav.goHome")} className="flex shrink-0 items-center gap-2.5">
            <Logo size={32} />
            <span className="text-lg font-semibold tracking-tight">HireMe</span>
          </Link>
          <div dir={dir} className="flex h-full items-stretch">
            <NavLinks links={links} />
          </div>
          {user && (
            <div dir={dir} className="ml-auto flex items-center gap-4">
              <GlobalSearch user={user} />
              {/* Job seekers hear about new jobs that match them; on the right, with the other actions */}
              {role === "SEEKER" && <PremiumToggle user={user} />}
              {role === "SEEKER" && <NotificationBell />}
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-8 py-8">{children}</main>
    </>
  )
}
