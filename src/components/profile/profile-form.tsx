"use client"

import { useState } from "react"
import { LinkIcon, MailIcon, MapPinIcon, PencilIcon, PhoneIcon } from "lucide-react"
import { toast } from "sonner"
import { PhoneInput } from "@/components/phone-input"
import { CompanyLogo } from "@/components/company-logo"
import { UserAvatar } from "@/components/user-avatar"
import { PhotoField } from "./cv-fields"
import { Badge } from "@/components/ui/badge"
import { Button, EDIT_LINK } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useI18n, useT } from "@/i18n/provider"
import { useStore } from "@/lib/store"
import type { ProfileInput, User } from "@/lib/types"
import { Field } from "./portfolio-fields"
import { cn } from "@/lib/utils"
import { SeekerProfile } from "./seeker-profile"

const toInput = (u: User): ProfileInput => ({
  name: u.name,
  title: u.title,
  company: u.company,
  email: u.email,
  phone: u.phone,
  city: u.city,
  linkedin: u.linkedin,
  facebook: u.facebook ?? "",
  bio: u.bio,
  photoId: u.photoId,
  country: u.country,
  address: u.address,
})

export function ProfileForm({ user }: { user: User }) {
  if (user.role === "SEEKER") return <SeekerProfile user={user} />
  return <StaffProfile user={user} />
}

// Employers and recruiters
function StaffProfile({ user }: { user: User }) {
  const t = useT()
  const [editing, setEditing] = useState(false)
  // The company first, as the heading; under it the person and their role
  const heading = user.company || user.name
  const subtitle = [user.company ? user.name : "", user.title].filter(Boolean).join(" · ")

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Phones: the name and role wrap instead of being cut short, and Edit profile goes under them */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {/* Employers: their company's logo (shown on their jobs); recruiters: their initials */}
        {user.role === "EMPLOYER" ? <CompanyLogo employer={user} size={72} /> : <UserAvatar name={user.name} color={user.avatarColor} size={72} />}
        <div className="min-w-0 grow basis-48">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="text-xl font-semibold tracking-tight break-words sm:truncate sm:text-2xl">{heading}</h1>
            <Badge variant="secondary">{t(`roles.${user.role}`)}</Badge>
          </div>
          {subtitle && <p className="text-muted-foreground sm:truncate">{subtitle}</p>}
        </div>
        {!editing && (
          <Button variant="ghost" className={cn(EDIT_LINK, "max-sm:-ms-2")} onClick={() => setEditing(true)}>
            <PencilIcon /> {t("profile.editProfile")}
          </Button>
        )}
      </div>

      {editing ? <EditForm user={user} onDone={() => setEditing(false)} /> : <ProfileDetails user={user} />}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-6">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

/** Facebook's "f", drawn like the other line icons */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function ProfileDetails({ user }: { user: User }) {
  const { t, locale } = useI18n()
  const contact = [
    { icon: MailIcon, label: t("profile.email"), value: user.email, href: user.email ? `mailto:${user.email}` : "", external: false },
    { icon: PhoneIcon, label: t("profile.phone"), value: user.phone, href: user.phone ? `tel:${user.phone.replace(/\s/g, "")}` : "", external: false },
    { icon: MapPinIcon, label: t("profile.city"), value: user.city, href: "", external: false },
    { icon: LinkIcon, label: t("profile.linkedin"), value: user.linkedin.replace(/^https?:\/\/(www\.)?/, ""), href: user.linkedin, external: true },
    { icon: FacebookIcon, label: t("profile.facebook"), value: (user.facebook ?? "").replace(/^https?:\/\/(www\.)?/, ""), href: user.facebook ?? "", external: true },
  ]

  return (
    <div className="space-y-4">
      <Card title={t("profile.about")}>
        {user.bio ? (
          <p className="leading-relaxed whitespace-pre-line">{user.bio}</p>
        ) : (
          <p className="text-muted-foreground">{t("profile.noBio")}</p>
        )}
      </Card>

      <Card title={t("profile.contact")}>
        <dl className="space-y-3">
          {contact.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <c.icon className="size-4 shrink-0 text-muted-foreground" />
              <dt className="sr-only">{c.label}</dt>
              <dd className="min-w-0 truncate">
                {!c.value ? (
                  <span className="text-muted-foreground">{t("profile.notAdded", { field: c.external ? c.label : c.label.toLowerCase() })}</span>
                ) : c.href ? (
                  <a href={c.href} target={c.external ? "_blank" : undefined} rel="noreferrer" className="hover:underline">
                    {c.value}
                  </a>
                ) : (
                  c.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <p className="px-1 text-xs text-muted-foreground">
        {t("profile.memberSince", { date: new Date(user.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : `${locale}-u-nu-latn`, { month: "long", year: "numeric" }) })}
      </p>
    </div>
  )
}

function EditForm({ user, onDone }: { user: User; onDone: () => void }) {
  const t = useT()
  const updateProfile = useStore((s) => s.updateProfile)
  const [form, setForm] = useState(() => toInput(user))
  const set = (key: keyof ProfileInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const res = updateProfile(form)
    if (!res.ok) return toast.error(res.error)
    toast.success(t("profile.saved"))
    onDone()
  }

  return (
    <form onSubmit={save} className="divide-y rounded-xl border bg-card">
      {/* The company logo, on every job they post */}
      {user.role === "EMPLOYER" && (
        <section className="space-y-3 p-6">
          <h2 className="font-medium">{t("profile.companyLogo")}</h2>
          <PhotoField logo photoId={form.photoId} name={form.company || form.name} color={user.avatarColor} onChange={(photoId) => setForm((f) => ({ ...f, photoId }))} />
        </section>
      )}
      <section className="space-y-4 p-6">
        <h2 className="font-medium">{t("profile.aboutYou")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("profile.fullName")} className="sm:col-span-2">
            <Input className="h-9" value={form.name} onChange={set("name")} autoFocus />
          </Field>
          <Field label={t("profile.jobTitle")}>
            <Input className="h-9" value={form.title} onChange={set("title")} />
          </Field>
          <Field label={t("profile.company")}>
            <Input className="h-9" value={form.company} onChange={set("company")} />
          </Field>
        </div>
        <Field label={t("profile.about")}>
          <Textarea rows={3} value={form.bio} onChange={set("bio")} placeholder={t("profile.bioPlaceholder")} />
        </Field>
      </section>

      <section className="space-y-4 p-6">
        <h2 className="font-medium">{t("profile.contact")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("profile.email")}>
            <Input className="h-9" type="email" value={form.email} onChange={set("email")} placeholder="name@example.com" />
          </Field>
          <Field label={t("profile.phone")}>
            <PhoneInput value={form.phone} onChange={(phone) => setForm((f) => ({ ...f, phone }))} />
          </Field>
          <Field label={t("profile.city")}>
            <Input className="h-9" value={form.city} onChange={set("city")} />
          </Field>
          <Field label={t("profile.linkedin")}>
            <Input className="h-9" value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/…" />
          </Field>
          <Field label={t("profile.facebook")}>
            <Input className="h-9" value={form.facebook ?? ""} onChange={set("facebook")} placeholder="https://facebook.com/…" />
          </Field>
        </div>
      </section>

      <div className="flex justify-end gap-2 p-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button type="submit">{t("common.save")}</Button>
      </div>
    </form>
  )
}
