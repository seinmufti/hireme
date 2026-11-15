import { JobsView } from "./view"

export const metadata = { title: "Jobs · HireMe" }

// "/jobs?q=sales" opens the search with "sales" already typed in
export default async function JobsPage({ searchParams }: PageProps<"/jobs">) {
  const { q, welcome, location, contract } = await searchParams
  // ?location=Erbil&contract=Full-time (from Home's search): those filters start on
  const one = (v: string | string[] | undefined) => (typeof v === "string" && v ? [v] : undefined)
  // ?welcome=1: a job seeker who just finished their CV
  return (
    <JobsView
      initialQuery={typeof q === "string" ? q : ""}
      initialFilters={{ location: one(location), contract: one(contract) }}
      welcome={welcome === "1"}
    />
  )
}
