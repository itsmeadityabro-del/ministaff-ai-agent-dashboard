// Small, dependency-free auth policy shared by server layouts and API authorization.
// Supabase's service-role client bypasses RLS, so this policy must run before privileged access.
export function hasVerifiedEmail(
  user: { email_confirmed_at?: string | null } | null | undefined
): boolean {
  return Boolean(user?.email_confirmed_at);
}
