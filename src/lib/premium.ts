import type { User } from "@/lib/types"

/**
 * Whether the account has HireMe Premium (one year of unlimited CV downloads without a watermark).
 * Everyone is premium for now; change this one function to lock the premium features.
 */
export function isPremium(user: Pick<User, "id"> | null): boolean {
  void user
  return true
}
