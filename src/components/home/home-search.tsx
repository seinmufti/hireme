"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BriefcaseIcon, MapPinIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useT } from "@/i18n/provider"
import { JOB_CITIES } from "@/lib/jobs"
import { CONTRACT_TYPES } from "@/lib/options"

const ANY = "any"

/** Home: search jobs by where (a city, remote or abroad) and the kind of contract; opens Jobs with those filters. */
export function HomeSearch() {
  const t = useT()
  const router = useRouter()
  const [location, setLocation] = useState(ANY)
  const [contract, setContract] = useState(ANY)
  const locations = [
    { value: ANY, label: t("home.anyLocation") },
    { value: "Remote", label: t("jobs.remote") },
    { value: "International", label: t("jobs.international") },
    ...JOB_CITIES.map((c) => ({ value: c, label: c })),
  ]
  const contracts = [{ value: ANY, label: t("home.anyContract") }, ...CONTRACT_TYPES.map((c) => ({ value: c, label: c }))]
  const search = () => {
    const params = new URLSearchParams()
    if (location !== ANY) params.set("location", location)
    if (contract !== ANY) params.set("contract", contract)
    const qs = params.toString()
    router.push(qs ? `/jobs?${qs}` : "/jobs")
  }
  return (
    <form
      className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center"
      onSubmit={(e) => {
        e.preventDefault()
        search()
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
        <Select items={locations} value={location} onValueChange={(v) => v && setLocation(v)}>
          <SelectTrigger className="h-9 w-full" aria-label={t("home.searchLocation")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {locations.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <BriefcaseIcon className="size-4 shrink-0 text-muted-foreground" />
        <Select items={contracts} value={contract} onValueChange={(v) => v && setContract(v)}>
          <SelectTrigger className="h-9 w-full" aria-label={t("home.searchContract")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contracts.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="h-9 px-5">
        <SearchIcon /> {t("common.search")}
      </Button>
    </form>
  )
}
