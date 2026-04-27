import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired — required for Server Components
  const { data: { user } } = await supabase.auth.getUser();

  // Protect authenticated app routes. Per-page auth checks still exist as
  // defense-in-depth, but middleware redirects keep unauthed users from
  // seeing brief loading skeletons of pages they shouldn't access.
  //
  // NOTE: `/chart/demo` is intentionally PUBLIC (marketing demo). Only
  // chart pages with a UUID id segment require auth — handled below.
  const url = request.nextUrl;
  const path = url.pathname;

  const isAlwaysProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/chat") ||
    path.startsWith("/onboarding");

  // /chart/<uuid> is protected; /chart/demo is not.
  const isProtectedChart =
    path.startsWith("/chart/") &&
    !path.startsWith("/chart/demo");

  const isProtected = isAlwaysProtected || isProtectedChart;

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";
    redirectUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
