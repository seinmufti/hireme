"use client"

import { useState } from "react"
import Link from "next/link"
import { FilePenLineIcon, LogInIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react"
import { ProfilePhoto } from "@/components/cv/photo"
import type { NavLink } from "@/components/nav-links"
import { signOut } from "@/components/real-screens"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useT } from "@/i18n/provider"
import { useBackend } from "@/lib/real-sync"
import type { User } from "@/lib/types"

/**
 * The signed-in user's picture at the end of the top bar. Its menu: who they are, their Profile, every tab, the CV
 * builder (job seekers), Settings and Sign out. Guests get a plain person icon, with the tabs and Sign in.
 */
export function UserMenu({ user, links }: { user: User; links: NavLink[] }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const guest = user.role === "GUEST"
  const isSeeker = user.role === "SEEKER"
  // The real version's sign-in email; the demo's accounts have their own
  const email = useBackend((s) => s.email) || user.loginEmail || user.email
  // Profile first (job seekers' is their Profile tab), then the other tabs
  const profileHref = isSeeker ? "/overview" : "/profile"
  const tabs = links.filter((l) => l.href !== profileHref)
  const item = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm hover:bg-muted"
  const close = () => setOpen(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<button type="button" className="shrink-0 rounded-full ring-offset-2 transition hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-ring" />}
        aria-label={guest ? t("nav.signIn") : user.name}
        title={guest ? t("nav.signIn") : user.name}
      >
        {guest ? (
          <span className="flex size-8 items-center justify-center rounded-full border bg-muted text-muted-foreground">
            <UserIcon className="size-4" />
          </span>
        ) : (
          <ProfilePhoto photoId={user.photoId} name={user.name} color={user.avatarColor} size={32} />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-0 p-0">
        {!guest && (
          <div className="flex items-center gap-3 border-b p-3">
            <ProfilePhoto photoId={user.photoId} name={user.name} color={user.avatarColor} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
            </div>
          </div>
        )}
        <nav className="border-b p-1.5">
          {!guest && (
            <Link href={profileHref} onClick={close} className={item}>
              <UserIcon className="size-4 text-muted-foreground" /> {t("nav.profile")}
            </Link>
          )}
          {tabs.map((l) => (
            <Link key={l.href} href={l.href} onClick={close} className={item}>
              <l.icon className="size-4 text-muted-foreground" /> {l.label}
            </Link>
          ))}
          {/* Job seekers: straight into editing their CV */}
          {isSeeker && (
            <Link href="/overview?edit=1" onClick={close} className={item}>
              <FilePenLineIcon className="size-4 text-muted-foreground" /> {t("nav.cvBuilder")}
            </Link>
          )}
          {!guest && (
            <Link href="/account" onClick={close} className={item}>
              <SettingsIcon className="size-4 text-muted-foreground" /> {t("nav.settings")}
            </Link>
          )}
        </nav>
        <div className="p-1.5">
          {guest ? (
            <Link href="/login" onClick={close} className={item}>
              <LogInIcon className="size-4 text-muted-foreground" /> {t("nav.signIn")}
            </Link>
          ) : (
            <button type="button" onClick={signOut} className={item}>
              <LogOutIcon className="size-4 text-muted-foreground" /> {t("auth.signOut")}
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
