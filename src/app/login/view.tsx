"use client"

import { Fragment, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { DownloadIcon, PlusIcon, RotateCcwIcon, SearchIcon, UploadIcon } from "lucide-react"
import { toast } from "sonner"
import { Logo } from "@/components/logo"
import { PhoneInput } from "@/components/phone-input"
import { DateOfBirthPicker } from "@/components/profile/date-of-birth-picker"
import { StoreGate } from "@/components/store-gate"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GENDERS, homeFor, ROLE_LABEL, type Role } from "@/lib/options"
import { downloadBackup, restoreFromFile } from "@/lib/backup"
import { restoreBackup } from "@/lib/safe-storage"
import { useStore } from "@/lib/store"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

// Same left-to-right order as the header switcher
const ORDER: Role[] = ["SEEKER", "RECRUITER", "EMPLOYER"]

export function LoginView() {
  return (
    <StoreGate>
      <Accounts />
    </StoreGate>
  )
}

function Accounts() {
  const router = useRouter()
  const users = useStore((s) => s.users)
  const talents = useStore((s) => s.talents)
  const currentId = useStore((s) => s.currentUserId)
  const switchAccount = useStore((s) => s.switchAccount)
  const [creating, setCreating] = useState<Role | null>(null)
  const [search, setSearch] = useState<Partial<Record<Role, string>>>({})

  const signIn = (id: string, role: Role) => {
    switchAccount(id)
    router.push(homeFor(role))
  }

  const subtitleFor = (u: User) =>
    u.company
      ? [u.title, u.company].filter(Boolean).join(" · ")
      : (talents.find((t) => t.userId === u.id)?.experiences[0]?.title ?? ROLE_LABEL[u.role])

  return (
    // Exactly one screen tall: if accounts don't fit, only the account lists scroll, never the page
    <main className="relative flex h-dvh flex-col items-center justify-center overflow-hidden px-8 py-5">
      <BackupButtons />
      <Logo size={48} className="shrink-0" />
      <h1 className="mt-2 shrink-0 text-2xl font-semibold tracking-tight">Welcome to HireMe</h1>
      <p className="mt-1 shrink-0 text-sm text-muted-foreground">Choose an account to continue, or create a new one</p>

      <div className="mt-5 flex min-h-0 items-stretch rounded-2xl border bg-card p-5 shadow-sm">
        {ORDER.map((role, i) => {
          const all = users.filter((u) => u.role === role)
          // With more than 4 accounts, a search box takes the place of the last row of the list
          const searchable = all.length > 4
          const q = (search[role] ?? "").trim().toLowerCase()
          const group = all.filter((u) => !q || `${u.name} ${subtitleFor(u)}`.toLowerCase().includes(q))
          return (
            <Fragment key={role}>
              {i > 0 && <span className="mx-8 w-px bg-border" aria-hidden />}
              <section className="flex min-h-0 w-56 flex-col items-center">
                <h2 className="mb-3 shrink-0 text-sm font-semibold tracking-wide text-muted-foreground uppercase">{ROLE_LABEL[role]}</h2>
                {/* Tall enough for 4 accounts; more than that scrolls (and it shrinks on short screens) */}
                {searchable && (
                  <div className="relative mb-2 w-full shrink-0">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search[role] ?? ""}
                      onChange={(e) => setSearch((s) => ({ ...s, [role]: e.target.value }))}
                      placeholder="Search accounts…"
                      aria-label={`Search ${ROLE_LABEL[role].toLowerCase()} accounts`}
                      className="h-9 pl-8"
                    />
                  </div>
                )}
                <div className={cn("flex min-h-0 w-full flex-col gap-2 overflow-y-auto", searchable ? "h-[218px]" : "h-[270px]")}>
                  {searchable && group.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">No accounts found.</p>
                  )}
                  {group.map((u) => {
                    const active = u.id === currentId
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => signIn(u.id, u.role)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-2.5 text-left transition hover:border-primary/50 hover:bg-brand-soft focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                          active && "border-primary/60 bg-brand-soft"
                        )}
                      >
                        <UserAvatar name={u.name} color={u.avatarColor} size={40} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{u.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{subtitleFor(u)}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setCreating(role)}
                  className="mt-2 flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-dashed py-2.5 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                >
                  <PlusIcon className="size-4" /> New {ROLE_LABEL[role].toLowerCase()}
                </button>
              </section>
            </Fragment>
          )
        })}
      </div>

      <NewAccountDialog
        role={creating}
        onClose={() => setCreating(null)}
        onCreated={(role) => {
          setCreating(null)
          // New job seekers go straight to editing their portfolio
          router.push(role === "SEEKER" ? "/profile?edit=1" : homeFor(role))
        }}
      />
    </main>
  )
}

function BackupButtons() {
  const fileInput = useRef<HTMLInputElement>(null)

  // Asked in the page itself: the browser's own confirm() box can be blocked, which would make the buttons do nothing
  const [asking, setAsking] = useState<{ kind: "reset" } | { kind: "upload"; file: File } | null>(null)

  const upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) setAsking({ kind: "upload", file })
  }

  const loadBackup = async (file: File) => {
    const res = await restoreFromFile(file)
    if (res.ok) toast.success("Backup loaded")
    else toast.error(res.error)
  }

  const resetDemo = useStore((s) => s.resetDemo)
  const reset = () => {
    resetDemo()
    toast.success("Demo data reset", {
      // The previous data is kept as a backup, so a reset can be undone
      action: {
        label: "Undo",
        onClick: () => {
          if (restoreBackup("hireme-demo")) useStore.persist.rehydrate()
          else toast.error("Nothing to restore")
        },
      },
    })
  }

  return (
    <div className="absolute top-5 right-8 flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setAsking({ kind: "reset" })}>
        <RotateCcwIcon /> Reset demo
      </Button>
      <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={upload} />
      <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
        <UploadIcon /> Upload backup
      </Button>
      <Button variant="outline" size="sm" onClick={downloadBackup}>
        <DownloadIcon /> Demo Download
      </Button>

      <Dialog open={asking !== null} onOpenChange={(open) => !open && setAsking(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{asking?.kind === "upload" ? "Load this backup?" : "Reset the demo?"}</DialogTitle>
            <DialogDescription>
              {asking?.kind === "upload"
                ? "This replaces everything in the app with the contents of the backup file. You can undo a reset, but not a backup, so download one first if you need it."
                : "This clears every change you've made in this browser and brings back the built-in demo accounts. You can undo it right after."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAsking(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const action = asking
                setAsking(null)
                if (action?.kind === "reset") reset()
                else if (action?.kind === "upload") void loadBackup(action.file)
              }}
            >
              {asking?.kind === "upload" ? "Load backup" : "Reset demo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const EMPTY_FORM ={ name: "", title: "", company: "", phone: "", email: "", gender: "", dateOfBirth: "" }

function NewAccountDialog({
  role,
  onClose,
  onCreated,
}: {
  role: Role | null
  onClose: () => void
  onCreated: (role: Role) => void
}) {
  const createAccount = useStore((s) => s.createAccount)
  const [form, setForm] = useState(EMPTY_FORM)
  const [openFor, setOpenFor] = useState<Role | null>(null)

  // Start with an empty form every time the dialog opens
  if (role !== openFor) {
    setOpenFor(role)
    setForm(EMPTY_FORM)
  }
  if (!role) return null

  const isSeeker = role === "SEEKER"
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }))
  const setText = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => set(key)(e.target.value)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const res = createAccount({ role, ...form })
    if (!res.ok) return toast.error(res.error)
    toast.success(isSeeker ? "Account created. Finish your portfolio to join The Pool." : "Account created")
    onCreated(role)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(isSeeker && "sm:max-w-md")}>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>New {ROLE_LABEL[role].toLowerCase()}</DialogTitle>
            <DialogDescription>
              {isSeeker
                ? "These details are added to your portfolio. You'll fill in the rest on your profile."
                : "You can add contact details later on your profile."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="new-name">Full name</Label>
            <Input id="new-name" className="h-9" value={form.name} onChange={setText("name")} autoFocus />
          </div>
          {isSeeker ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone number</Label>
                <PhoneInput value={form.phone} onChange={set("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-email">Email</Label>
                <Input id="new-email" className="h-9" type="email" value={form.email} onChange={setText("email")} placeholder="name@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={form.gender || null} onValueChange={(v) => set("gender")((v as string) ?? "")}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date of birth</Label>
                <DateOfBirthPicker value={form.dateOfBirth} onChange={set("dateOfBirth")} />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="new-title">Job title</Label>
                <Input id="new-title" className="h-9" value={form.title} onChange={setText("title")} placeholder="e.g. HR Manager" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-company">Company</Label>
                <Input id="new-company" className="h-9" value={form.company} onChange={setText("company")} />
              </div>
            </>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create account</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
