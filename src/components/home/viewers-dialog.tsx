"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ProfilePhoto } from "@/components/cv/photo"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useI18n, useT, useTimeAgo } from "@/i18n/provider"
import { useStore } from "@/lib/store"

/** The job seeker's Viewers: who opened their CV (employers; recruiters aren't counted), latest visit first. */
export function useProfileViewers(seekerId: string | undefined) {
  const views = useStore((s) => s.profileViews)
  const users = useStore((s) => s.users)
  return useMemo(
    () =>
      (views ?? [])
        .filter((v) => v.seekerId === seekerId)
        .flatMap((v) => {
          const viewer = users.find((u) => u.id === v.viewerId)
          return viewer && viewer.role !== "RECRUITER" ? [{ view: v, viewer }] : []
        })
        .sort((a, b) => b.view.at.localeCompare(a.view.at)),
    [views, users, seekerId]
  )
}

export function ViewersDialog({ seekerId, open, onOpenChange }: { seekerId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT()
  const timeAgo = useTimeAgo()
  const { locale } = useI18n()
  const lang = locale === "en" ? "en-GB" : locale
  const viewers = useProfileViewers(seekerId)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("home.viewersTitle")}</DialogTitle>
          <DialogDescription>{t("home.viewersHint")}</DialogDescription>
        </DialogHeader>
        {viewers.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("home.noViewers")}</p>
        ) : (
          <ul className="-mx-2 max-h-[60vh] divide-y overflow-y-auto">
            {viewers.map(({ view, viewer }) => (
              <li key={view.id} className="flex items-center gap-3 px-2 py-2.5">
                <ProfilePhoto photoId={viewer.photoId} name={viewer.company || viewer.name} color={viewer.avatarColor} size={36} />
                <div className="min-w-0 flex-1">
                  {/* Companies by their name, with a link to their page */}
                  {viewer.role === "EMPLOYER" && viewer.company ? (
                    <Link href={`/companies/${viewer.id}`} className="block truncate text-sm font-medium hover:underline" onClick={() => onOpenChange(false)}>
                      {viewer.company}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-medium">{viewer.name}</p>
                  )}
                  <p className="truncate text-xs text-muted-foreground">{[viewer.name !== viewer.company && viewer.name, viewer.title].filter(Boolean).join(" · ")}</p>
                </div>
                {/* When: the day and time, and how long ago */}
                <span className="shrink-0 text-end text-xs text-muted-foreground tabular-nums">
                  {new Date(view.at).toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric" })},{" "}
                  {new Date(view.at).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })}
                  <br />
                  {timeAgo(view.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
