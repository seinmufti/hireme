import Anthropic from "@anthropic-ai/sdk"
import { IS_DEMO } from "@/lib/mode"
import { aiAccess } from "@/lib/supabase/server"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import mammoth from "mammoth"
import { CV_IMPORT_MAX_BYTES } from "@/lib/cv-import"
import { normalizeCv } from "./normalize"
import { SAMPLE_CV_READ } from "./sample"
import { CvReadSchema, SYSTEM_PROMPT } from "./schema"

// POST a CV (form field "file": PDF, DOCX, plain text or an image) and get back { cv: CvImport }.
// Reading a long CV can take a while.
export const maxDuration = 120

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const
type ImageType = (typeof IMAGE_TYPES)[number]
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

const fail = (status: number, error: string) => Response.json({ error }, { status })

/** The file as content Claude can read, or an error message. */
async function toContent(file: File): Promise<Anthropic.Beta.BetaContentBlockParam | string> {
  const name = file.name.toLowerCase()
  const bytes = Buffer.from(await file.arrayBuffer())
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data: bytes.toString("base64") } }
  }
  if (IMAGE_TYPES.includes(file.type as ImageType)) {
    return { type: "image", source: { type: "base64", media_type: file.type as ImageType, data: bytes.toString("base64") } }
  }
  let text: string
  if (file.type === DOCX_TYPE || name.endsWith(".docx")) {
    text = (await mammoth.extractRawText({ buffer: bytes })).value
  } else if (file.type === "text/plain" || name.endsWith(".txt")) {
    text = bytes.toString("utf8")
  } else if (name.endsWith(".doc")) {
    return "Old Word files (.doc) aren't supported. Please save it as .docx or PDF."
  } else {
    return "Please upload a PDF, a Word file (.docx) or a photo of your CV."
  }
  if (!text.trim()) return "That file has no text we can read."
  return { type: "text", text: `<cv>\n${text}\n</cv>` }
}

export async function POST(request: Request) {
  // Real version: only signed-in people, up to a daily limit (each request costs money)
  if (!IS_DEMO) {
    const access = await aiAccess("cv-import", 10)
    if (access === "signedOut") return fail(401, "Please sign in first.")
    if (access === "limit") return fail(429, "You've reached today's limit for CV imports. Please try again tomorrow.")
  }
  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File)) return fail(400, "Please choose a file.")
  if (file.size > CV_IMPORT_MAX_BYTES) return fail(413, "That file is over 10 MB. Please upload a smaller one.")

  const content = await toContent(file).catch(() => "We couldn't open that file. Is it damaged?")
  if (typeof content === "string") return fail(415, content)

  // Demo without an API key: CV_IMPORT_MOCK=1 returns a sample CV
  if (process.env.CV_IMPORT_MOCK === "1") return Response.json({ cv: normalizeCv(SAMPLE_CV_READ) })

  // Without a key the SDK only fails once the request is sent, with an error that isn't easy to tell apart
  const notSetUp = () => fail(503, "CV import isn't set up yet. Add ANTHROPIC_API_KEY to .env.local (see README).")
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return notSetUp()
  let client: Anthropic
  try {
    client = new Anthropic()
  } catch {
    return notSetUp()
  }

  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      // Extraction doesn't need deep thinking; medium keeps it quick
      output_config: { effort: "medium", format: betaZodOutputFormat(CvReadSchema) },
      // If the model declines, the API retries on its recommended fallback model
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: [content, { type: "text", text: "Read this CV and fill in the profile." }] }],
    })

    if (response.stop_reason === "refusal") return fail(422, "We couldn't read that file as a CV.")
    if (response.stop_reason === "max_tokens") return fail(422, "That CV is too long to read in one go.")
    const read = response.parsed_output
    if (!read) return fail(502, "We couldn't read that CV. Please try again.")
    if (read.uncertain.includes("file") && !read.user.name && !read.talent.experiences.length) {
      return fail(422, "That doesn't look like a CV.")
    }
    return Response.json({ cv: normalizeCv(read) })
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return fail(503, "CV import isn't set up correctly: the ANTHROPIC_API_KEY was rejected.")
    }
    if (error instanceof Anthropic.RateLimitError) return fail(429, "Too many CVs are being read right now. Please try again in a minute.")
    if (error instanceof Anthropic.BadRequestError) {
      console.error("[cv-import]", error.message)
      return fail(422, "We couldn't read that file. Try a PDF or a clearer photo.")
    }
    if (error instanceof Anthropic.APIError) {
      console.error("[cv-import]", error.status, error.message)
      return fail(502, "The CV reader is unavailable right now. Please try again.")
    }
    console.error("[cv-import]", error)
    // E.g. no credentials found when the request is sent
    if (error instanceof Anthropic.AnthropicError) return notSetUp()
    return fail(500, "Something went wrong reading your CV.")
  }
}
