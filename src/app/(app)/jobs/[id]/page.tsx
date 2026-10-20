import { JobView } from "./view"

export const metadata = { title: "Job · HireMe" }

export default async function JobPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params
  return <JobView id={id} />
}
