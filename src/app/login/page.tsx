import { IS_DEMO } from "@/lib/mode"
import { RealLoginView } from "./real-view"
import { LoginView } from "./view"

export const metadata = { title: "Sign in · HireMe" }

// The demo picks a ready-made account; the real version signs in for real
export default function LoginPage() {
  return IS_DEMO ? <LoginView /> : <RealLoginView />
}
