import { ApplicationView } from "./view"

export const metadata = { title: "Application · HireMe" }

export default async function ApplicationPage({ params }: PageProps<"/jobs/applied/[id]">) {
  const { id } = await params
  return <ApplicationView id={id} />
}
