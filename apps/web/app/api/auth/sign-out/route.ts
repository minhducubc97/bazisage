import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/sign-out
 *
 * Used by `<form action="/api/auth/sign-out" method="POST">` in the dashboard.
 * After clearing the session we redirect back to the landing page so the
 * server-component dashboard doesn't render against a stale auth cookie.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Use 303 See Other so the browser switches POST → GET on the redirect.
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
