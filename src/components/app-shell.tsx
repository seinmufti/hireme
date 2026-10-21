"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BriefcaseIcon, Building2Icon, FileUserIcon, HomeIcon, LogInIcon, MailIcon, SendIcon, UserIcon, UsersIcon } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { GlobalSearch } from "@/components/global-search"
import { DevTools } from "@/components/dev-tools"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Logo } from "@/components/logo"
import { NavLinks, type NavLink } from "@/components/nav-links"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { StoreGate } from "@/components/store-gate"
import { buttonVariants } from "@/components/ui/button"
import { useI18n } from "@/i18n/provider"
import { unreadCountFor, useCurrentUser, useStore } from "@/lib/store"
import { BrandName } from "@/components/brand-name"

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
  const unread = useStore((s) => (user && (user.role === "SEEKER" || user.role === "EMPLOYER") ? unreadCountFor(s, user.id) : 0))
  const role = user?.role

  const home = { href: "/home", label: t("nav.home"), icon: HomeIcon }
  // What used to be Home: the CV at a glance, stats, notifications and actions
  const overview = { href: "/overview", label: t("nav.profile"), icon: UserIcon }
  const jobs = { href: "/jobs", label: t("nav.jobs"), icon: BriefcaseIcon }
  // Employers don't search jobs; their Jobs tab is their own posts
  const myJobs = { href: "/jobs/mine", label: t("nav.jobs"), icon: BriefcaseIcon }
  // The CV page: your details, with Edit and the Preview CV button
  const cv = { href: "/profile", label: t("nav.cvPreview"), icon: FileUserIcon }
  // The list of all companies is for recruiters only; everyone can still open a company from its jobs
  // The jobs a job seeker applied to
  const applications = { href: "/jobs/applied", label: t("nav.applications"), icon: SendIcon }
  const companies = { href: "/companies", label: t("nav.companies"), icon: Building2Icon }
  const pool = { href: "/pool", label: t("nav.pool"), icon: UsersIcon }
  const profile = { href: "/profile", label: t("nav.profile"), icon: UserIcon }
  const links: NavLink[] =
    role === "EMPLOYER"
      ? [pool, myJobs, profile]
      : role === "RECRUITER"
        ? [pool, jobs, companies, profile]
        : role === "SEEKER"
          ? [home, overview, cv, jobs, applications]
          : role === "GUEST"
            ? [jobs]
            : []

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        {/* Follows the language: logo on the left in English, on the right in Arabic and Kurdish */}
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:gap-6 lg:px-8">
          <Link href="/login" title={t("nav.goLogin")} className="flex shrink-0 items-center gap-2.5">
            <Logo size={32} />
            <BrandName className="text-lg font-semibold tracking-tight" />
          </Link>
          {/* Smaller screens: the links are in the bar at the bottom */}
          <div className="hidden h-full items-stretch lg:flex">
            <NavLinks links={links} />
          </div>
          {user && (
            <div className="ms-auto flex items-center gap-1 sm:gap-2 lg:gap-4">
              <GlobalSearch user={user} />
              {/* Messages: a mail icon, just before the bell */}
              {(role === "SEEKER" || role === "EMPLOYER") && <InboxButton unread={unread} />}
              {/* Job seekers hear about new jobs that match them; on the right, with the other actions */}
              {role === "SEEKER" && <NotificationBell />}
              <LanguageSwitcher />
              {/* Guests browse; signing in (or creating an account) is one click away */}
              {role === "GUEST" && (
                <Link href="/login" className={buttonVariants({ size: "sm" })}>
                  <LogInIcon /> {t("nav.signIn")}
                </Link>
              )}
            </div>
          )}
        </div>
      </header>
      {/* Room at the bottom for the Dev tools button (and, on smaller screens, the tab bar) */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-[calc(10rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pt-8 lg:pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</main>
      <BottomNav links={links} />
      {/* Demo accounts and the Premium crown */}
      <DevTools user={user} />
    </>
  )
}

/** The inbox as a mail icon with the number of unread messages, next to the notification bell. */
function InboxButton({ unread }: { unread: number }) {
  const { t } = useI18n()
  const active = usePathname().startsWith("/inbox")
  return (
    <Link
      href="/inbox"
      aria-label={t("nav.inbox")}
      title={t("nav.inbox")}
      aria-current={active ? "page" : undefined}
      className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
    >
      <MailIcon className="size-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -end-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 font-semibold text-primary-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  )
}
