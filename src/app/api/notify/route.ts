import { translator } from "@/i18n/translate"
import type { MessageKey } from "@/i18n/types"
import { adminSupabase, serverSupabase } from "@/lib/supabase/server"
import type { Notification } from "@/lib/types"

// Real version: emails a notification to the person it's for, at their work email (the one on their profile),
// right after someone else created it. The browser that created it calls this with its id; the notification
// is checked here (it exists, it's new, not emailed yet, and the caller had the right to send it), then sent
// once through Resend and marked emailedAt.

const fail = (status: number, error: string) => Response.json({ error }, { status })
const SITE = process.env.SITE_URL ?? "https://nordlyssolutions.com/hireme"
const FRESH_MS = 10 * 60 * 1000
const LOCALES = ["en", "ar", "ckb"] as const
const STATUS_KEY: Record<string, string> = {
  Applied: "statusApplied",
  Shortlisted: "statusShortlisted",
  Contacted: "statusContacted",
  Interview: "statusInterview",
  Accepted: "statusAccepted",
  "Not selected": "statusNotSelected",
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

export async function POST(request: Request) {
  const me = (await (await serverSupabase())?.auth.getUser())?.data.user
  const db = adminSupabase()
  if (!me || !db) return fail(401, "Sign in first.")
  const key = process.env.RESEND_API_KEY
  if (!key) return fail(503, "Email isn't set up.")
  const body = await request.json().catch(() => null)
  if (typeof body?.id !== "string") return fail(400, "Which notification?")

  const { data: row } = await db.from("notifications").select("id, user_id, job_id, data").eq("id", body.id).maybeSingle()
  if (!row) return fail(404, "No such notification.")
  const n = row.data as Notification & { emailedAt?: string }
  // Only once, only for someone else, only while it's new
  if (n.emailedAt || row.user_id === me.id || Date.now() - Date.parse(n.createdAt) > FRESH_MS) return Response.json({ ok: true, skipped: true })

  const { data: job } = await db.from("jobs").select("employer_id, data").eq("id", row.job_id).maybeSingle()
  if (!job) return fail(404, "No such job.")
  // The employer, about their own job; or a job seeker, to the job's employer, about their own application
  const allowed = job.employer_id === me.id || (job.employer_id === row.user_id && n.actorId === me.id && (n.kind === "applied" || n.kind === "withdrawn" || n.kind === "reinstateRequest"))
  if (!allowed) return fail(403, "Not yours to send.")

  // Their work email: the one on their profile
  const { data: priv } = await db.from("profile_private").select("email, full_name").eq("id", row.user_id).maybeSingle()
  const to = priv?.email || (await db.auth.admin.getUserById(row.user_id)).data.user?.email
  if (!to) return Response.json({ ok: true, skipped: true })

  // Who did it, by first name (employers see job seekers that way)
  const actorName = n.actorId ? ((await db.from("profiles").select("display_name").eq("id", n.actorId).maybeSingle()).data?.display_name ?? "").split(" ")[0] : ""
  const title: string = job.data?.title ?? ""
  const company: string = job.data?.company ?? ""
  const forEmployer = n.kind === "applied" || n.kind === "withdrawn" || n.kind === "reinstateRequest"
  const path = forEmployer ? `/jobs/${row.job_id}#applicants` : n.kind === "match" || n.kind === "follow" ? `/jobs/${row.job_id}` : "/jobs/applied"

  // The same words as in the app, in English, Arabic and Kurdish
  const line = (locale: (typeof LOCALES)[number]) => {
    const t = translator(locale)
    const status = n.status ? t.dynamic(`applications.${STATUS_KEY[n.status] ?? "statusApplied"}`, n.status) : ""
    const k = (key: string, vars?: Record<string, string>) => t(key as MessageKey, vars)
    return n.kind === "rejected"
      ? k("notifications.notSelected", { company })
      : n.kind === "status"
        ? k("notifications.statusChanged", { company, status })
        : n.kind === "viewed"
          ? k("notifications.applicationViewed", { company })
          : n.kind === "applied"
            ? k("notifications.newApplicant", { name: actorName })
            : n.kind === "withdrawn"
              ? k("notifications.applicantWithdrew", { name: actorName })
              : n.kind === "reinstateRequest"
                ? k("notifications.reinstateRequest", { name: actorName })
                : n.kind === "reinstateAccepted"
                  ? k("notifications.reinstateAccepted", { company })
                  : n.kind === "reinstateDeclined"
                    ? k("notifications.reinstateDeclined", { company })
              : n.kind === "follow"
                ? k("notifications.newFromFollowed", { company })
                : k("notifications.newJob")
  }
  const [en, ar, ckb] = LOCALES.map(line)
  const reason = (n.kind === "rejected" || n.kind === "reinstateDeclined" || n.kind === "reinstateRequest") && n.reason ? n.reason : ""
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f2f1;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
<tr><td style="font-size:24px;font-weight:bold"><span style="color:#000000">Hire</span><span style="color:#F03838">Me!</span></td></tr>
<tr><td style="padding-top:20px;font-size:16px;line-height:24px">${escape(en)}</td></tr>
<tr><td dir="rtl" style="padding-top:8px;font-size:16px;line-height:24px">${escape(ar)}</td></tr>
<tr><td dir="rtl" style="padding-top:8px;font-size:16px;line-height:24px">${escape(ckb)}</td></tr>
<tr><td style="padding-top:16px;font-size:15px;line-height:22px"><b>${escape(title)}</b>${company ? ` · ${escape(company)}` : ""}</td></tr>
${reason ? `<tr><td style="padding-top:12px"><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px;color:#7f1d1d;font-size:14px;line-height:20px">${escape(reason)}</div></td></tr>` : ""}
<tr><td style="padding:24px 0 0"><a href="${SITE}${path}" style="display:block;background:#8f1d45;border-radius:10px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;text-align:center;padding:14px 8px">Open HireMe · فتح HireMe · کردنەوەی HireMe</a></td></tr>
</table></body></html>`

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "HireMe <no-reply@nordlyssolutions.com>", to, subject: `${en}${title ? `: ${title}` : ""}`, html }),
  })
  if (!sent.ok) return fail(502, "Couldn't send the email.")
  await db.from("notifications").update({ data: { ...n, emailedAt: new Date().toISOString() } }).eq("id", row.id)
  return Response.json({ ok: true })
}
