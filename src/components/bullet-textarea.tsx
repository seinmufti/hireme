"use client"

import { useLayoutEffect, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"

const BULLET = "• "

/**
 * A text box for lists that become bullet points on the CV: every line shows a "•" while typing.
 * The bullets are only shown here; `value` stays plain lines. Enter starts a new bullet, and Backspace
 * right after a bullet joins that line to the one above.
 */
export function BulletTextarea({
  value,
  onChange,
  ...props
}: Omit<React.ComponentProps<typeof Textarea>, "value" | "onChange"> & { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  // Where the cursor goes after the next render (bullets shift positions)
  const caret = useRef<number | null>(null)
  const shown = value ? value.split("\n").map((line) => BULLET + line).join("\n") : ""

  useLayoutEffect(() => {
    if (caret.current === null || !ref.current) return
    ref.current.setSelectionRange(caret.current, caret.current)
    caret.current = null
  })

  // Position in the plain text → position in the text with bullets
  const toShown = (plain: string, at: number) => at + BULLET.length * (plain.slice(0, at).split("\n").length)

  const change = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value
    const at = e.target.selectionStart
    // Take the bullets (and any typed or pasted ones) off each line, keeping track of the cursor
    let plain = ""
    let plainAt = 0
    raw.split("\n").forEach((line, i, all) => {
      const start = raw.split("\n").slice(0, i).join("\n").length + (i ? 1 : 0)
      const prefix = line.match(/^[•\-*]\s?/)?.[0].length ?? 0
      const text = line.slice(prefix)
      if (at >= start && at <= start + line.length) plainAt = plain.length + Math.max(0, at - start - prefix)
      plain += text + (i < all.length - 1 ? "\n" : "")
    })
    caret.current = plain ? toShown(plain, plainAt) : 0
    onChange(plain)
  }

  const keyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    if (e.key !== "Backspace" || el.selectionStart !== el.selectionEnd) return
    const before = el.value.slice(0, el.selectionStart)
    const lineStart = before.lastIndexOf("\n") + 1
    // Backspace right after a line's bullet: join it to the line above (or clear the bullet of an empty first line)
    if (before.slice(lineStart) !== BULLET) return
    e.preventDefault()
    const lines = value.split("\n")
    const index = before.split("\n").length - 1
    if (index === 0) {
      if (!lines[0] && lines.length === 1) onChange("")
      return
    }
    const joined = [...lines.slice(0, index - 1), lines[index - 1] + lines[index], ...lines.slice(index + 1)].join("\n")
    const plainAt = lines.slice(0, index).join("\n").length
    caret.current = toShown(joined, plainAt)
    onChange(joined)
  }

  return <Textarea ref={ref} value={shown} onChange={change} onKeyDown={keyDown} {...props} />
}
