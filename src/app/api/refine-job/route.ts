import Anthropic from "@anthropic-ai/sdk"
import { IS_DEMO } from "@/lib/mode"
import { serverSupabase } from "@/lib/supabase/server"

// POST { title, description } and get back { description } with the wording improved.
// The employer's "Improve wording" button on the job form.

const MAX_CHARS = 6000

const SYSTEM_PROMPT = `You edit job descriptions for HireMe, a job site in Iraq and the Kurdistan Region.
Rewrite the employer's description so it reads clearly and professionally:
- Keep every fact the employer gave (tasks, requirements, hours, place, pay, benefits) and add none.
- Keep the language the employer wrote in (English, Arabic or Kurdish).
- Plain, direct sentences. Lists go on lines starting with "- ", one point per line, verbs first.
- Fix spelling and grammar. No headings, no markdown other than the "- " lines, no emojis.
- Keep it about as long as the original, or shorter.
Reply with the rewritten description only.`

const fail = (status: number, error: string) => Response.json({ error }, { status })

export async function POST(request: Request) {
  // Real version: only signed-in people (each request costs money)
  if (!IS_DEMO && !(await (await serverSupabase())?.auth.getUser())?.data.user) return fail(401, "Please sign in first.")
  const body = await request.json().catch(() => null)
  const title = typeof body?.title === "string" ? body.title.trim() : ""
  const description = typeof body?.description === "string" ? body.description.trim() : ""
  if (!description) return fail(400, "Write a description first.")
  if (description.length > MAX_CHARS) return fail(413, "That description is too long to improve in one go.")

  // Demo without an API key (same switch as CV import): the text comes back unchanged
  if (process.env.CV_IMPORT_MOCK === "1") return Response.json({ description })

  const notSetUp = () => fail(503, "Improving wording isn't set up yet. Add ANTHROPIC_API_KEY to .env.local (see README).")
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return notSetUp()
  let client: Anthropic
  try {
    client = new Anthropic()
  } catch {
    return notSetUp()
  }

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      // A short rewrite: little thinking needed, so it comes back quickly
      output_config: { effort: "low" },
      // If the model declines, the API retries on its recommended fallback model
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `<job_title>${title}</job_title>\n<description>\n${description}\n</description>` }],
    })
    if (response.stop_reason === "refusal") return fail(422, "We couldn't improve that description.")
    if (response.stop_reason === "max_tokens") return fail(422, "That description is too long to improve in one go.")
    const text = response.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("")
      .trim()
    if (!text) return fail(502, "We couldn't improve that description. Please try again.")
    return Response.json({ description: text })
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return fail(503, "Improving wording isn't set up correctly: the ANTHROPIC_API_KEY was rejected.")
    if (error instanceof Anthropic.RateLimitError) return fail(429, "Too many requests right now. Please try again in a minute.")
    if (error instanceof Anthropic.APIError) {
      console.error("[refine-job]", error.status, error.message)
      return fail(502, "Improving wording is unavailable right now. Please try again.")
    }
    console.error("[refine-job]", error)
    if (error instanceof Anthropic.AnthropicError) return notSetUp()
    return fail(500, "Something went wrong improving the description.")
  }
}
