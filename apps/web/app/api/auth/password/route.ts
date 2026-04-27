import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/auth/password — email+password sign in
export async function POST(request: NextRequest) {
  const { email, password, redirectTo } = await request.json() as {
    email: string;
    password: string;
    redirectTo?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const dest = redirectTo ?? "/dashboard";
  return NextResponse.json({ ok: true, url: dest });
}
