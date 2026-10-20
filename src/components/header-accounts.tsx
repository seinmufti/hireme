"use client"

import { Fragment, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UserAvatar } from "@/components/user-avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { firstName } from "@/lib/format"
import { homeFor, type Role } from "@/lib/options"
import { recentLogins } from "@/lib/recent-accounts"
import { useStore } from "@/lib/store"
import { useT } from "@/i18n/provider"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

// One account per role: the one signed in to most recently. The rest are under "+N more".
const SHOWN = 1

// Left to right in the header
const ORDER: Role[] = ["SEEKER", "RECRUITER", "EMPLOYER"]

/** "+N more": every account of a role in a searchable list. */
function MoreAccounts({
  accounts,
  hidden,
  currentId,
  subtitle,
  onPick,
}: {
  accounts: User[]
  hidden: number
  currentId: string | null
  subtitle: (id: string) => string
  onPick: (a: User) => void
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const matches = accounts.filter((a) => !q || `${a.name} ${subtitle(a.id)}`.toLowerCase().includes(q))

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setQuery("")
      }}
    >
      {/* Opens on hover too (click still works) */}
      <PopoverTrigger
        openOnHover
        delay={100}
        render={
          <button
            type="button"
            className="rounded-full px-2 py-1 text-xs whitespace-nowrap text-muted-foreground hover:bg-muted hover:text-foreground"
          />
        }
      >
        {t("accounts.more", { count: hidden })}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 gap-0 p-0">
        <div className="flex items-center gap-2 border-b px-3">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && matches[0]) {
                onPick(matches[0])
                setOpen(false)
              }
            }}
            placeholder={t("accounts.searchPlaceholder")}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <div className="max-h-[min(18rem,calc(var(--available-height)-4.5rem))] overflow-y-auto p-1">
          {matches.length === 0 && <p className="px-3 py-4 text-center text-sm text-muted-foreground">{t("accounts.noneFound")}</p>}
          {matches.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                if (a.id !== currentId) onPick(a)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-start text-sm hover:bg-muted",
                a.id === currentId && "bg-brand-soft"
              )}
            >
              <UserAvatar name={a.name} color={a.avatarColor} size={28} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{a.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{subtitle(a.id)}</span>
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Demo login: every account, grouped by role, one click to sign in as them.
export function HeaderAccounts() {
  const t = useT()
  const router = useRouter()
  const users = useStore((s) => s.users)
  const talents = useStore((s) => s.talents)
  const currentId = useStore((s) => s.currentUserId)
  const switchAccount = useStore((s) => s.switchAccount)
  const conversations = useStore((s) => s.conversations)
  const pathname = usePathname()

  // Stay in the Inbox when switching between accounts that have one (job seekers and employers),
  // and keep the open conversation if the new account is part of it. Otherwise go to the role's home.
  const destinationFor = (a: User) => {
    if (pathname.startsWith("/inbox") && (a.role === "EMPLOYER" || a.role === "SEEKER")) {
      const thread = conversations.find((c) => pathname === `/inbox/${c.id}`)
      return thread && (thread.employerId === a.id || thread.seekerId === a.id) ? pathname : "/inbox"
    }
    return homeFor(a.role)
  }

  const subtitle = (id: string) => {
    const u = users.find((x) => x.id === id)!
    if (u.company) return [u.title, u.company].filter(Boolean).join(" · ")
    return talents.find((x) => x.userId === id)?.experiences[0]?.title ?? t(`roles.${u.role}`)
  }

  return (
    <div className="flex items-center">
      {ORDER.map((role, i) => {
        const all = users.filter((u) => u.role === role)
        // Only the account signed in to most recently is shown (the signed-in account, when it has this role);
        // the full list is under "more".
        const recent = recentLogins()
        const rank = (u: User) => {
          const i = recent.indexOf(u.id)
          return i === -1 ? recent.length + all.indexOf(u) : i
        }
        const group = [...all].sort((a, b) => rank(a) - rank(b)).slice(0, SHOWN)
        if (currentId && all.some((u) => u.id === currentId) && !group.some((u) => u.id === currentId)) group[SHOWN - 1] = all.find((u) => u.id === currentId)!
        const hidden = all.length - group.length
        return (
          <Fragment key={role}>
            {i > 0 && <span className="mx-3 h-10 w-px bg-border" aria-hidden />}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] leading-none font-medium tracking-wide text-muted-foreground uppercase">
                {t(`roles.${role}`)}
              </span>
              <div className="flex items-center gap-1">
                {group.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                {group.map((a) => {
                  const active = a.id === currentId
                  return (
                    <Tooltip key={a.id}>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            aria-label={t("accounts.signInAs", { name: a.name })}
                            aria-pressed={active}
                            onClick={() => {
                              if (active) return
                              switchAccount(a.id)
                              router.push(destinationFor(a))
                            }}
                            className={cn(
                              "flex items-center gap-1.5 rounded-full border py-0.5 pr-3 pl-0.5 text-sm whitespace-nowrap transition",
                              active
                                ? "border-primary bg-brand-soft font-medium text-primary"
                                : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                            )}
                          />
                        }
                      >
                        <UserAvatar name={a.name} color={a.avatarColor} size={24} />
                        {firstName(a.name)}
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <div>
                          <div className="font-medium">{a.name}{active && ` ${t("accounts.signedIn")}`}</div>
                          <div className="opacity-70">{subtitle(a.id)}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
                {hidden > 0 && (
                  <MoreAccounts
                    accounts={all}
                    hidden={hidden}
                    currentId={currentId}
                    subtitle={subtitle}
                    onPick={(a) => {
                      switchAccount(a.id)
                      router.push(destinationFor(a))
                    }}
                  />
                )}
              </div>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}
