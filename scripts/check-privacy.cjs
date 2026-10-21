// Checks the real database's privacy rules with throwaway accounts, then deletes them.
// Run from the project folder: node scripts/check-privacy.cjs (needs the Supabase keys in .env.local)
const fs = require("fs")
const { createClient } = require(process.cwd() + "/node_modules/@supabase/supabase-js")
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]))
const URL = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SERVICE = env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })
const pw = "Test-" + Math.random().toString(36).slice(2) + "-x9"
const tag = Date.now()
const results = []
const check = (name, ok, detail = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`)

async function makeUser(label, meta) {
  const email = `hireme-test-${label}-${tag}@example.com`
  const { data, error } = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: meta })
  if (error) throw new Error(label + ": " + error.message)
  const client = createClient(URL, ANON, { auth: { persistSession: false } })
  const s = await client.auth.signInWithPassword({ email, password: pw })
  if (s.error) throw new Error(label + " sign-in: " + s.error.message)
  return { id: data.user.id, client }
}

;(async () => {
  const ids = []
  try {
    const A = await makeUser("seeker-a", { name: "Aram Mustafa Test", role: "SEEKER" }); ids.push(A.id)
    const B = await makeUser("seeker-b", { name: "Bana Test", role: "SEEKER" }); ids.push(B.id)
    const E = await makeUser("employer", { name: "Karwan Test", role: "EMPLOYER", company: "Test Co" }); ids.push(E.id)
    const anon = createClient(URL, ANON, { auth: { persistSession: false } })

    // Sign-up created the profiles
    const prof = await admin.from("profiles").select("id, role, display_name, onboarded").in("id", ids)
    const pA = prof.data.find((p) => p.id === A.id), pE = prof.data.find((p) => p.id === E.id)
    check("sign-up creates the profile with the chosen role", pA?.role === "SEEKER" && pE?.role === "EMPLOYER" && pA.onboarded)
    check("job seekers are shown by first name only", pA?.display_name === "Aram", pA?.display_name)

    // A fills in contact details and a CV
    await A.client.from("profile_private").update({ phone: "+964 750 000 0000", address: "Secret Street" }).eq("id", A.id)
    const talent = await A.client.from("talents").insert({ id: `t-${tag}`, user_id: A.id, data: { id: `t-${tag}`, userId: A.id, summary: "hi", listed: true } })
    check("a job seeker can save their CV", !talent.error, talent.error?.message)

    const own = await A.client.from("profile_private").select("*").eq("id", A.id)
    check("a job seeker reads their own contact details", own.data?.length === 1 && own.data[0].phone === "+964 750 000 0000")
    const bReadsA = await B.client.from("profile_private").select("*").eq("id", A.id)
    check("another job seeker can't read them", bReadsA.data?.length === 0)
    const eReadsA = await E.client.from("profile_private").select("*").eq("id", A.id)
    check("an employer can't read a job seeker's contact details", eReadsA.data?.length === 0)
    const aReadsE = await A.client.from("profile_private").select("email").eq("id", E.id)
    check("a company's contact details are public", aReadsE.data?.length === 1)

    const bTalents = await B.client.from("talents").select("id").eq("user_id", A.id)
    check("another job seeker can't read a CV", bTalents.data?.length === 0)
    const eTalents = await E.client.from("talents").select("id").eq("user_id", A.id)
    check("an employer can read a CV (the Pool)", eTalents.data?.length === 1)
    const anonTalents = await anon.from("talents").select("id")
    check("visitors can't read CVs", anonTalents.data?.length === 0)

    const promote = await A.client.from("profiles").update({ role: "RECRUITER" }).eq("id", A.id)
    const after = await admin.from("profiles").select("role").eq("id", A.id).single()
    check("nobody can make themselves a recruiter", after.data.role === "SEEKER", promote.error ? "refused" : "no error, but unchanged")
    const hijack = await B.client.from("profiles").update({ title: "hacked" }).eq("id", A.id)
    const titleA = await admin.from("profiles").select("title").eq("id", A.id).single()
    check("nobody can change another's profile", titleA.data.title !== "hacked")

    // Jobs and applications
    const job = await E.client.from("jobs").insert({ id: `j-${tag}`, employer_id: E.id, data: { id: `j-${tag}`, employerId: E.id, title: "Test job" } })
    check("an employer posts a job", !job.error, job.error?.message)
    const seekerJob = await A.client.from("jobs").insert({ id: `j2-${tag}`, employer_id: A.id, data: {} })
    check("a job seeker can't post a job", !!seekerJob.error)
    const anonJobs = await anon.from("jobs").select("id").eq("id", `j-${tag}`)
    check("visitors can see job listings", anonJobs.data?.length === 1)
    const bEditsJob = await B.client.from("jobs").update({ data: { title: "hacked" } }).eq("id", `j-${tag}`)
    const jobNow = await admin.from("jobs").select("data").eq("id", `j-${tag}`).single()
    check("nobody else can change a job", jobNow.data.data.title === "Test job")

    const app = await A.client.from("applications").insert({ id: `a-${tag}`, job_id: `j-${tag}`, seeker_id: A.id, data: { id: `a-${tag}`, status: "Applied" } })
    check("a job seeker applies", !app.error, app.error?.message)
    const eApps = await E.client.from("applications").select("id")
    check("the employer sees the application", eApps.data?.some((a) => a.id === `a-${tag}`))
    const bApps = await B.client.from("applications").select("id")
    check("another job seeker can't see it", bApps.data?.length === 0)
    const fake = await B.client.from("applications").insert({ id: `a2-${tag}`, job_id: `j-${tag}`, seeker_id: A.id, data: {} })
    check("nobody can apply in someone else's name", !!fake.error)

    // Messages
    const conv = await E.client.from("conversations").insert({ id: `c-${tag}`, employer_id: E.id, seeker_id: A.id, data: { id: `c-${tag}` } })
    const msg = await E.client.from("messages").insert({ id: `m-${tag}`, conversation_id: `c-${tag}`, sender_id: E.id, data: { body: "hello" } })
    check("an employer messages a job seeker", !conv.error && !msg.error, conv.error?.message || msg.error?.message)
    const aMsgs = await A.client.from("messages").select("id")
    check("the job seeker reads it", aMsgs.data?.length === 1)
    const bMsgs = await B.client.from("messages").select("id")
    check("nobody else can read it", bMsgs.data?.length === 0)
    const bConv = await B.client.from("conversations").select("id")
    check("nobody else sees the conversation", bConv.data?.length === 0)

    // Notifications
    const notify = await E.client.from("notifications").insert({ id: `n-${tag}`, user_id: A.id, job_id: `j-${tag}`, data: {} })
    check("an employer can notify a job seeker about their own job", !notify.error, notify.error?.message)
    const spam = await B.client.from("notifications").insert({ id: `n2-${tag}`, user_id: A.id, job_id: `j-${tag}`, data: {} })
    check("others can't send notifications", !!spam.error)
    const bNotes = await B.client.from("notifications").select("id")
    check("notifications are private", bNotes.data?.length === 0)

    // Files
    const file = await A.client.storage.from("files").upload(`${A.id}/x/photo.txt`, new Blob(["hi"], { type: "text/plain" }))
    check("a user uploads to their own folder", !file.error, file.error?.message)
    const intoOthers = await B.client.storage.from("files").upload(`${A.id}/y/evil.txt`, new Blob(["x"], { type: "text/plain" }))
    check("nobody uploads into another's folder", !!intoOthers.error)
    await admin.storage.from("files").remove([`${A.id}/x/photo.txt`])
  } catch (e) {
    results.push("ERROR  " + e.message)
  } finally {
    for (const id of ids) await admin.auth.admin.deleteUser(id)
    console.log(results.join("\n"))
    console.log(`\n${results.filter((r) => r.startsWith("PASS")).length} passed, ${results.filter((r) => !r.startsWith("PASS")).length} failed. Test accounts deleted.`)
  }
})()
