import { JobsView } from "./view"

export const metadata = { title: "Jobs · HireMe" }

// "/jobs?q=sales" opens the search with "sales" already typed in
export default async function JobsPage({ searchParams }: PageProps<"/jobs">) {
  const { q, welcome, location, contract, job } = await searchParams
  // ?location=Erbil&contract=Full-time (from Home's search): those filters start on
  const many = (v: string | string[] | undefined) => {
    const list = (Array.isArray(v) ? v : [v]).filter((x): x is string => !!x)
    return list.length ? list : undefined
  }
  // ?welcome=1: a job seeker who just finished their CV
  return (
    <JobsView
      initialQuery={typeof q === "string" ? q : ""}
      initialFilters={{ location: many(location), contract: many(contract) }}
      welcome={welcome === "1"}
      // ?job=… (a job opened from anywhere else): that job is the one open
      initialJob={typeof job === "string" ? job : undefined}
    />
  )
}
