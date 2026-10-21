import { JobsView } from "./view"

export const metadata = { title: "Job listings · HireMe" }

// "/jobs?q=sales" opens the search with "sales" already typed in
export default async function JobsPage({ searchParams }: PageProps<"/jobs">) {
  const { q, welcome } = await searchParams
  // ?welcome=1: a job seeker who just finished their CV
  return <JobsView initialQuery={typeof q === "string" ? q : ""} welcome={welcome === "1"} />
}
