import { InboxShell } from "./inbox-shell"

export const metadata = { title: "Inbox · HireMe" }

export default function InboxLayout({ children }: LayoutProps<"/inbox">) {
  return <InboxShell>{children}</InboxShell>
}
