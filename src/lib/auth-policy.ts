// Small, dependency-free auth policy shared by server layouts and API authorization.
// Supabase's service-role client bypasses RLS, so this policy must run before privileged access.
// Email-based identities must confirm email; phone-only identities must confirm phone.
// An unverified email must not be bypassed merely because a phone field is also present.
export function hasVerifiedContact(
  user: {
    email?: string | null;
    email_confirmed_at?: string | null;
    phone?: string | null;
    phone_confirmed_at?: string | null;
  } | null | undefined
): boolean {
  if (!user) return false;
  if (user.email) return Boolean(user.email_confirmed_at);
  return Boolean(user.phone && user.phone_confirmed_at);
}

// Keep role interpretation in one testable policy module. Unknown roles must never receive access.
export function hasWorkspaceMembership(role: string | null | undefined): boolean {
  return role === "admin" || role === "member";
}

export function hasWorkspaceAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}

export function isApiRoutePath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

// HTML pages redirect to login; APIs pass through to their JSON-authenticated route handlers.
export function shouldRedirectToLogin(
  pathname: string,
  isPublic: boolean,
  hasUser: boolean,
): boolean {
  return !isPublic && !isApiRoutePath(pathname) && !hasUser;
}
