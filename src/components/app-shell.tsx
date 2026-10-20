"use client"

import Link from "next/link"
import { BriefcaseIcon, Building2Icon, FileUserIcon, HomeIcon, InboxIcon, UserIcon, UsersIcon } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { GlobalSearch } from "@/components/global-search"
import { DevTools } from "@/components/dev-tools"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Logo } from "@/components/logo"
import { NavLinks, type NavLink } from "@/components/nav-links"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { StoreGate } from "@/components/store-gate"
import { useI18n } from "@/i18n/provider"
import { unreadCountFor, useCurrentUser, useStore } from "@/lib/store"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreGate>
      <Shell>{children}</Shell>
    </StoreGate>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const user = useCurrentUser()
  const unread = useStore((s) => (user && user.role !== "RECRUITER" ? unreadCountFor(s, user.id) : 0))
  const role = user?.role

  const home = { href: "/home", label: t("nav.home"), icon: HomeIcon }
  const jobs = { href: "/jobs", label: t("nav.jobs"), icon: BriefcaseIcon }
  // Employers don't search jobs; their Jobs tab is their own posts
  const myJobs = { href: "/jobs/mine", label: t("nav.jobs"), icon: BriefcaseIcon }
  // The CV page: your details, with Edit and the Preview CV button
  const cv = { href: "/profile", label: t("nav.cvPreview"), icon: FileUserIcon }
  const companies = { href: "/companies", label: t("nav.companies"), icon: Building2Icon }
  const pool = { href: "/pool", label: t("nav.pool"), icon: UsersIcon }
  const inbox = { href: "/inbox", label: t("nav.inbox"), icon: InboxIcon, badge: unread }
  const profile = { href: "/profile", label: t("nav.profile"), icon: UserIcon }
  const links: NavLink[] =
    role === "EMPLOYER"
      ? [pool, myJobs, companies, inbox, profile]
      : role === "RECRUITER"
        ? [pool, jobs, companies, profile]
        : role === "SEEKER"
          ? [home, cv, jobs, inbox, companies]
          : []

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
        {/* Follows the language: logo on the left in English, on the right in Arabic and Kurdish */}
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:gap-6 lg:px-8">
          <Link href="/login" title={t("nav.goLogin")} className="flex shrink-0 items-center gap-2.5">
            <Logo size={32} />
            <span className="text-lg font-semibold tracking-tight">HireMe</span>
          </Link>
          {/* Smaller screens: the links are in the bar at the bottom */}
          <div className="hidden h-full items-stretch lg:flex">
            <NavLinks links={links} />
          </div>
          {user && (
            <div className="ms-auto flex items-center gap-1 sm:gap-2 lg:gap-4">
              <GlobalSearch user={user} />
              {/* Job seekers hear about new jobs that match them; on the right, with the other actions */}
              {role === "SEEKER" && <NotificationBell />}
              <LanguageSwitcher />
            </div>
          )}
        </div>
      </header>
      {/* Room at the bottom for the Dev tools button (and, on smaller screens, the tab bar) */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-40 sm:px-6 lg:px-8 lg:pt-8 lg:pb-24">{children}</main>
      <BottomNav links={links} />
      {/* Demo accounts and the Premium crown */}
      <DevTools user={user} />
    </>
  )
}
