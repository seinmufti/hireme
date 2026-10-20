import { JobsView } from "./view"

export const metadata = { title: "Jobs · HireMe" }

// "/jobs?q=sales" opens the search with "sales" already typed in
export default async function JobsPage({ searchParams }: PageProps<"/jobs">) {
  const { q } = await searchParams
  return <JobsView initialQuery={typeof q === "string" ? q : ""} />
}
