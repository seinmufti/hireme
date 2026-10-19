"use client"

import { useState } from "react"
import { LinkIcon, MailIcon, MapPinIcon, PencilIcon, PhoneIcon } from "lucide-react"
import { toast } from "sonner"
import { PhoneInput } from "@/components/phone-input"
import { UserAvatar } from "@/components/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ROLE_LABEL } from "@/lib/options"
import { useStore } from "@/lib/store"
import type { ProfileInput, User } from "@/lib/types"
import { Field } from "./portfolio-fields"
import { SeekerProfile } from "./seeker-profile"

const toInput = (u: User): ProfileInput => ({
  name: u.name,
  title: u.title,
  company: u.company,
  email: u.email,
  phone: u.phone,
  city: u.city,
  linkedin: u.linkedin,
  bio: u.bio,
})

export function ProfileForm({ user }: { user: User }) {
  if (user.role === "SEEKER") return <SeekerProfile user={user} />
  return <StaffProfile user={user} />
}

// Employers and recruiters
function StaffProfile({ user }: { user: User }) {
  const [editing, setEditing] = useState(false)
  const subtitle = [user.title, user.company].filter(Boolean).join(" · ")

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-5">
        <UserAvatar name={user.name} color={user.avatarColor} size={72} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{user.name}</h1>
            <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
          </div>
          {subtitle && <p className="truncate text-muted-foreground">{subtitle}</p>}
        </div>
        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <PencilIcon /> Edit profile
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

function ProfileDetails({ user }: { user: User }) {
  const contact = [
    { icon: MailIcon, label: "Email", value: user.email, href: user.email ? `mailto:${user.email}` : "" },
    { icon: PhoneIcon, label: "Phone", value: user.phone, href: user.phone ? `tel:${user.phone.replace(/\s/g, "")}` : "" },
    { icon: MapPinIcon, label: "City", value: user.city, href: "" },
    { icon: LinkIcon, label: "LinkedIn", value: user.linkedin.replace(/^https?:\/\/(www\.)?/, ""), href: user.linkedin },
  ]

  return (
    <div className="space-y-4">
      <Card title="About">
        {user.bio ? (
          <p className="leading-relaxed whitespace-pre-line">{user.bio}</p>
        ) : (
          <p className="text-muted-foreground">No bio yet.</p>
        )}
      </Card>

      <Card title="Contact">
        <dl className="space-y-3">
          {contact.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <c.icon className="size-4 shrink-0 text-muted-foreground" />
              <dt className="sr-only">{c.label}</dt>
              <dd className="min-w-0 truncate">
                {!c.value ? (
                  <span className="text-muted-foreground">No {c.label === "LinkedIn" ? c.label : c.label.toLowerCase()} added</span>
                ) : c.href ? (
                  <a href={c.href} target={c.label === "LinkedIn" ? "_blank" : undefined} rel="noreferrer" className="hover:underline">
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
        Member since {new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
      </p>
    </div>
  )
}

function EditForm({ user, onDone }: { user: User; onDone: () => void }) {
  const updateProfile = useStore((s) => s.updateProfile)
  const [form, setForm] = useState(() => toInput(user))
  const set = (key: keyof ProfileInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const res = updateProfile(form)
    if (!res.ok) return toast.error(res.error)
    toast.success("Profile saved")
    onDone()
  }

  return (
    <form onSubmit={save} className="divide-y rounded-xl border bg-card">
      <section className="space-y-4 p-6">
        <h2 className="font-medium">About you</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name" className="col-span-2">
            <Input className="h-9" value={form.name} onChange={set("name")} autoFocus />
          </Field>
          <Field label="Job title">
            <Input className="h-9" value={form.title} onChange={set("title")} />
          </Field>
          <Field label="Company">
            <Input className="h-9" value={form.company} onChange={set("company")} />
          </Field>
        </div>
        <Field label="About">
          <Textarea rows={3} value={form.bio} onChange={set("bio")} placeholder="A short introduction" />
        </Field>
      </section>

      <section className="space-y-4 p-6">
        <h2 className="font-medium">Contact</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <Input className="h-9" type="email" value={form.email} onChange={set("email")} placeholder="name@example.com" />
          </Field>
          <Field label="Phone">
            <PhoneInput value={form.phone} onChange={(phone) => setForm((f) => ({ ...f, phone }))} />
          </Field>
          <Field label="City">
            <Input className="h-9" value={form.city} onChange={set("city")} />
          </Field>
          <Field label="LinkedIn">
            <Input className="h-9" value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/…" />
          </Field>
        </div>
      </section>

      <div className="flex justify-end gap-2 p-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}
