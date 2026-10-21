import { PageSkeleton } from "@/components/page-skeleton"

// Shown straight away when a link is clicked, while the next page comes from the server.
// It also lets Next.js prefetch every page's shell ahead of time (the pages are rendered per request).
export default function Loading() {
  return <PageSkeleton />
}
