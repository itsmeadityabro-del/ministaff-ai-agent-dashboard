import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isApiRoutePath, shouldRedirectToLogin } from "@/lib/auth-policy";

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    pathname === "/" ||
    pathname === "/api/health" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/invite");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer the current publishable key; retain anon as a migration fallback.
  const supabaseApiKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Keep public/setup routes available without Supabase credentials. API routes must
  // return JSON to callers, not an HTML login redirect. When Supabase is not configured,
  // fail API requests closed with an explicit 503; otherwise the route handler checks auth.
  if (!supabaseUrl || !supabaseApiKey) {
    if (isPublic) {
      return NextResponse.next({ request });
    }
    if (isApiRoutePath(pathname)) {
      return NextResponse.json(
        { error: { code: "auth_not_configured", message: "API authentication is not configured" } },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseApiKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Every API route has its own session/role or secret check. Let it produce a structured
  // JSON 401/403/503 instead of redirecting fetch() callers to HTML, which breaks apiFetch().
  if (shouldRedirectToLogin(pathname, isPublic, Boolean(user))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
