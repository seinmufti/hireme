import { ThreadView } from "./thread-view"

export default async function ThreadPage({ params }: PageProps<"/inbox/[id]">) {
  const { id } = await params
  return <ThreadView id={id} />
}
