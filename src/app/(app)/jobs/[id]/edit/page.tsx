import { EditJobView } from "./view"

export const metadata = { title: "Edit job · HireMe" }

export default async function EditJobPage({ params }: PageProps<"/jobs/[id]/edit">) {
  const { id } = await params
  return <EditJobView id={id} />
}
