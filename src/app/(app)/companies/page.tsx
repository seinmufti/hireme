import { CompaniesView } from "./view"

export const metadata = { title: "Companies · HireMe" }

// "/companies?q=telecom" opens the directory with "telecom" already typed in
export default async function CompaniesPage({ searchParams }: PageProps<"/companies">) {
  const { q } = await searchParams
  return <CompaniesView initialQuery={typeof q === "string" ? q : ""} />
}
