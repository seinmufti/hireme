"use client"

import type { RealtimePostgresChangesPayload, SupabaseClient } from "@supabase/supabase-js"
import { toast } from "sonner"
import { create } from "zustand"
import { firstName } from "@/lib/format"
import { listingMissing, useStore, withJobFunctions, type Data } from "@/lib/store"
import { supabase } from "@/lib/supabase/client"
import type { Role } from "@/lib/options"
import type { Reference, Talent, User } from "@/lib/types"

// Real version: the app keeps using the same store as the demo, and this file connects it to Supabase.
// - Load: after sign-in, everything the database lets this person see goes into the store.
// - Save: every change to the store is written to its table (new rows inserted, changed rows updated,
//   removed rows deleted). The database's rules reject anything that isn't theirs to change.
// - Live: new messages, notifications, applications and conversations arrive from the database.
// The app's actions (apply, post a job, send a message...) are the demo's, unchanged.

/** Where the real version is: still loading, signed out (browsing as a visitor), or signed in. */
export const useBackend = create<{ status: "loading" | "signedOut" | "signedIn"; email: string; onboarded: boolean; approved: boolean; premium: boolean }>(() => ({
  status: "loading",
  email: "",
  onboarded: true,
  // Employers wait for HireMe's approval before they see the Pool or post jobs
  approved: true,
  // HireMe Premium, given by an admin (until premium_until)
  premium: false,
}))

/** Signed-out visitors browse job listings as this guest (never saved). */
export const VISITOR_ID = "visitor"
const VISITOR: User = {
  id: VISITOR_ID,
  name: "Guest",
  role: "GUEST",
  title: "",
  company: "",
  avatarColor: "#64748B",
  email: "",
  phone: "",
  city: "",
  linkedin: "",
  bio: "",
  photoId: "",
  country: "",
  address: "",
  createdAt: new Date(0).toISOString(),
}

type Row = Record<string, unknown> & { id: string; data: Record<string, unknown> }
type Key = "talents" | "jobs" | "applications" | "conversations" | "messages" | "notifications" | "savedJobs" | "savedTalents" | "follows" | "profileViews"

/** Each synced store list, its table, and the columns the database rules need. In write order (parents first). */
const TABLES: { key: Key; table: string; rowId: (o: Record<string, unknown>) => string; columns: (o: Record<string, unknown>) => Record<string, unknown> }[] = [
  { key: "talents", table: "talents", rowId: (o) => o.id as string, columns: (o) => ({ user_id: o.userId }) },
  { key: "jobs", table: "jobs", rowId: (o) => o.id as string, columns: (o) => ({ employer_id: o.employerId }) },
  { key: "applications", table: "applications", rowId: (o) => o.id as string, columns: (o) => ({ job_id: o.jobId, seeker_id: o.seekerId }) },
  { key: "conversations", table: "conversations", rowId: (o) => o.id as string, columns: (o) => ({ employer_id: o.employerId, seeker_id: o.seekerId }) },
  { key: "messages", table: "messages", rowId: (o) => o.id as string, columns: (o) => ({ conversation_id: o.conversationId, sender_id: o.senderId }) },
  { key: "notifications", table: "notifications", rowId: (o) => o.id as string, columns: (o) => ({ user_id: o.userId, job_id: o.jobId }) },
  // One user's saved item or follow: the row id includes the user
  { key: "savedJobs", table: "saved_jobs", rowId: (o) => `${o.userId}:${o.id}`, columns: (o) => ({ user_id: o.userId }) },
  { key: "savedTalents", table: "saved_talents", rowId: (o) => `${o.userId}:${o.id}`, columns: (o) => ({ user_id: o.userId }) },
  { key: "follows", table: "follows", rowId: (o) => `${o.userId}:${o.employerId}`, columns: (o) => ({ user_id: o.userId, employer_id: o.employerId }) },
  // Who opened a job seeker's CV: the viewer writes it, the job seeker reads it
  { key: "profileViews", table: "profile_views", rowId: (o) => o.id as string, columns: (o) => ({ seeker_id: o.seekerId, viewer_id: o.viewerId }) },
]

// True while data from the database goes into the store, so it isn't written back
let fromDatabase = false
let uid: string | null = null
let started = false

/** Puts data from the database into the store without writing it back. */
function setRemote(patch: Partial<Data>) {
  fromDatabase = true
  try {
    useStore.setState(patch)
  } finally {
    fromDatabase = false
  }
}

type ProfileRow = { id: string; role: Role; display_name: string; title: string; company: string; avatar_color: string; city: string; country: string; bio: string; photo_id: string; onboarded: boolean; approved: boolean; premium_until: string | null; created_at: string }
type PrivateRow = { id: string; full_name: string; email: string; phone: string; address: string; linkedin: string }

/**
 * The store's users from the profiles. Contact details come only where the database shares them (your own,
 * and companies'). Other job seekers' contact details stay hidden; whether their CV is complete for the Pool
 * comes from their CV instead (`listed`, saved by its owner).
 */
function toUsers(profiles: ProfileRow[], privates: PrivateRow[], talents: Talent[]): User[] {
  const priv = new Map(privates.map((p) => [p.id, p]))
  const listed = new Set(talents.filter((t) => (t as Talent & { listed?: boolean }).listed).map((t) => t.userId))
  return profiles.map((p) => {
    const own = priv.get(p.id)
    const hidden = listed.has(p.id) ? "•" : ""
    return {
      id: p.id,
      name: own?.full_name || p.display_name,
      role: p.role,
      title: p.title,
      company: p.company,
      avatarColor: p.avatar_color,
      email: own ? own.email : hidden,
      phone: own ? own.phone : hidden,
      city: p.city,
      linkedin: own?.linkedin ?? "",
      bio: p.bio,
      photoId: p.photo_id,
      country: p.country,
      address: own?.address ?? "",
      createdAt: p.created_at,
    }
  })
}

// The private part of a CV is kept out of the CV row, which employers can read, and saved in cv_private,
// which only the CV's owner can: references' names and contact details (the CV row only keeps that one
// exists) and the exact birth date (the CV row keeps the year and month, enough for the age).
type References = Record<string, Reference>
type CvPrivate = { references?: References; dateOfBirth?: string }
const HIDDEN_REFERENCE: Reference = { name: "", position: "", phone: "", email: "" }

/** The CV as saved in talents: references blanked out, the birth date cut to year and month. */
function withoutPrivate(t: Talent): Talent {
  return {
    ...t,
    dateOfBirth: t.dateOfBirth ? `${t.dateOfBirth.slice(0, 7)}-01` : t.dateOfBirth,
    experiences: t.experiences.map((e) => ({ ...e, reference: e.reference && HIDDEN_REFERENCE })),
  }
}

/** The private part of a CV, for cv_private. */
function privateOf(t: Talent): CvPrivate {
  return {
    references: Object.fromEntries(t.experiences.flatMap((e) => (e.reference ? [[e.id, e.reference]] : []))),
    dateOfBirth: t.dateOfBirth,
  }
}

/** Your own CV with its private part put back. */
function withPrivate(t: Talent, p: CvPrivate): Talent {
  const refs = p.references ?? {}
  return {
    ...t,
    dateOfBirth: p.dateOfBirth || t.dateOfBirth,
    experiences: t.experiences.map((e) => ({ ...e, reference: e.reference && (refs[e.id] ?? e.reference) })),
  }
}

/** Loads everything this visitor may see. */
async function loadAll(db: SupabaseClient, userId: string | null) {
  const get = async <T>(table: string) => {
    const { data, error } = await db.from(table).select("*")
    if (error) throw new Error(`${table}: ${error.message}`)
    return (data ?? []) as T[]
  }
  const [profiles, privates, cvPrivate, ...rows] = await Promise.all([
    get<ProfileRow>("profiles"),
    get<PrivateRow>("profile_private"),
    userId ? get<{ id: string; data: CvPrivate }>("cv_private") : Promise.resolve([]),
    ...TABLES.map((t) => (userId || t.key === "jobs" ? get<Row>(t.table) : Promise.resolve([] as Row[]))),
  ])
  let lists = Object.fromEntries(TABLES.map((t, i) => [t.key, rows[i].map((r) => r.data)])) as unknown as Pick<Data, Key>
  // Rows saved with the older categories show today's job functions (and are saved that way when next changed)
  lists = withJobFunctions(lists)
  const own = cvPrivate.find((r) => r.id === userId)?.data ?? {}
  lists.talents = lists.talents.map((t) => (t.userId === userId ? withPrivate(t, own) : t))
  const users = toUsers(profiles, privates, lists.talents)
  const me = profiles.find((p) => p.id === userId)
  useBackend.setState({
    onboarded: me?.onboarded ?? true,
    approved: me?.approved ?? true,
    premium: !!me?.premium_until && new Date(me.premium_until) > new Date(),
  })
  setRemote({ ...lists, users: userId ? users : [...users, VISITOR], currentUserId: userId ?? VISITOR_ID })
}

/** Writes the store's changes to the database. */
async function save(prev: Data, next: Data) {
  const db = supabase()
  if (!db || !uid) return
  try {
    // Your own account: the public part (job seekers by first name) and the private part
    const before = prev.users.find((u) => u.id === uid)
    const mine = next.users.find((u) => u.id === uid)
    if (mine && before && mine !== before) {
      const name = mine.role === "SEEKER" ? firstName(mine.name) : mine.name
      const pub = await db.from("profiles").update({
        display_name: name,
        title: mine.title,
        company: mine.company,
        avatar_color: mine.avatarColor,
        city: mine.city,
        country: mine.country,
        bio: mine.bio,
        photo_id: mine.photoId,
      }).eq("id", uid)
      if (pub.error) throw pub.error
      const priv = await db.from("profile_private").update({
        full_name: mine.name,
        email: mine.email,
        phone: mine.phone,
        address: mine.address,
        linkedin: mine.linkedin,
      }).eq("id", uid)
      if (priv.error) throw priv.error
    }

    for (const t of TABLES) {
      const a = (prev[t.key] ?? []) as unknown as Record<string, unknown>[]
      const b = (next[t.key] ?? []) as unknown as Record<string, unknown>[]
      if (a === b) continue
      const old = new Map(a.map((o) => [t.rowId(o), o]))
      const now = new Map(b.map((o) => [t.rowId(o), o]))
      // A CV also says whether it's complete for the Pool (others can't see the contact details to check),
      // and its private part goes to cv_private instead
      const data = (o: Record<string, unknown>) =>
        t.key === "talents" && mine
          ? { ...withoutPrivate(o as unknown as Talent), listed: listingMissing(mine, o as unknown as Talent).length === 0 }
          : o
      const added = [...now].filter(([id]) => !old.has(id))
      const changed = [...now].filter(([id, o]) => old.has(id) && old.get(id) !== o)
      const removed = [...old.keys()].filter((id) => !now.has(id))
      const myCv = t.key === "talents" && [...added, ...changed].map(([, o]) => o as unknown as Talent).find((o) => o.userId === uid)
      if (myCv) {
        const res = await db.from("cv_private").upsert({ id: uid, data: privateOf(myCv) })
        if (res.error) throw res.error
      }
      if (added.length) {
        const res = await db.from(t.table).insert(added.map(([id, o]) => ({ id, ...t.columns(o), data: data(o) })))
        if (res.error) throw res.error
        // Notifications for someone else are emailed to them too (see /api/notify)
        if (t.key === "notifications")
          for (const [id, o] of added)
            if (o.userId !== uid)
              fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/notify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {})
      }
      for (const [id, o] of changed) {
        const res = await db.from(t.table).update({ ...t.columns(o), data: data(o) }).eq("id", id)
        if (res.error) throw res.error
      }
      if (removed.length) {
        const res = await db.from(t.table).delete().in("id", removed)
        if (res.error) throw res.error
      }
    }
  } catch (e) {
    console.error("[sync]", e)
    toast.error("Couldn't save that. Please check your connection and try again.")
    // Back to what the database has, so the screen doesn't show something that wasn't saved
    if (uid) loadAll(db, uid).catch(() => {})
  }
}

/** New rows from the database (someone else's message, a notification, an application) as they happen. */
function listen(db: SupabaseClient) {
  const keyOf: Record<string, Key> = { messages: "messages", notifications: "notifications", applications: "applications", conversations: "conversations" }
  const channel = db.channel("hireme-live")
  for (const table of Object.keys(keyOf)) {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, (payload: RealtimePostgresChangesPayload<Row>) => {
      const key = keyOf[table]
      const list = (useStore.getState()[key] ?? []) as unknown as Record<string, unknown>[]
      let next = list
      if (payload.eventType === "DELETE") next = list.filter((o) => o.id !== (payload.old as Row).id)
      else {
        const row = payload.new as Row
        next = list.some((o) => o.id === row.id) ? list.map((o) => (o.id === row.id ? row.data : o)) : [...list, row.data]
      }
      setRemote({ [key]: next } as Partial<Data>)
    })
  }
  channel.subscribe()
}

/** Loads everything again (e.g. after choosing a role). */
export async function reloadRealData() {
  const db = supabase()
  if (!db) return
  await loadAll(db, uid)
}

/**
 * Starts the real version: follows sign-in and sign-out, loads the data, and saves changes.
 * Called once from the app's shell.
 */
export function startRealSync() {
  const db = supabase()
  if (!db || started) return
  started = true

  const begin = async (userId: string | null, email: string) => {
    uid = userId
    useBackend.setState({ status: "loading", email })
    try {
      await loadAll(db, userId)
    } catch (e) {
      console.error("[sync] load", e)
      toast.error("Couldn't load HireMe. Please reload the page.")
    }
    useBackend.setState({ status: userId ? "signedIn" : "signedOut" })
    // Job seekers hear about listings that match them (saved like any other change)
    if (userId) useStore.getState().checkJobMatches()
  }

  db.auth.onAuthStateChange((event, session) => {
    const userId = session?.user.id ?? null
    if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "SIGNED_OUT" || (event === "USER_UPDATED" && userId !== uid)) {
      if (event === "SIGNED_IN" && userId === uid) return
      // Out of the auth callback, so Supabase isn't waited on (its docs advise this)
      setTimeout(() => begin(userId, session?.user.email ?? ""), 0)
    }
  })

  useStore.subscribe((next, prev) => {
    if (fromDatabase || useBackend.getState().status !== "signedIn") return
    save(prev as Data, next as Data)
  })
  listen(db)
}
