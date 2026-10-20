import { CompanyView } from "./view"

export const metadata = { title: "Company · HireMe" }

export default async function CompanyPage({ params }: PageProps<"/companies/[id]">) {
  const { id } = await params
  return <CompanyView id={id} />
}
