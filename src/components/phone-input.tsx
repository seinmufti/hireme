"use client"

import { Input } from "@/components/ui/input"
import { formatIraqiPhone } from "@/lib/format"

const PREFIX = "+964 "

/**
 * Iraqi phone number field. Clicking into an empty field fills in "+964 " so you can start
 * with the local number; deleting it is still possible. Typing or pasting is formatted as
 * "+964 750 000 0103".
 */
export function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Input
      className="h-9"
      type="tel"
      inputMode="tel"
      value={value}
      placeholder="+964 750 000 0000"
      onFocus={() => {
        if (!value) onChange(PREFIX)
      }}
      // Leaving the field with only the prefix in it empties it again
      onBlur={() => {
        if (value.trim() === PREFIX.trim()) onChange("")
      }}
      onChange={(e) => {
        const raw = e.target.value
        const formatted = formatIraqiPhone(raw)
        // Keep the prefix while typing after it (a leading 0 like "0750" formats to nothing yet);
        // deleting into the prefix itself clears the field
        onChange(!formatted && raw.startsWith(PREFIX) ? PREFIX : formatted)
      }}
    />
  )
}
