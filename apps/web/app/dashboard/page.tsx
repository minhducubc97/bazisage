import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch user's charts
  const { data: charts } = await supabase
    .from("bazi_charts")
    .select("id, subject_name, birth_date, day_master, day_master_element, day_master_strength, mode, created_at")
    .is("deleted_at", null)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, subscription_tier")
    .eq("id", user.id)
    .single();

  const firstName = (profile?.display_name ?? user.email ?? "").split(" ")[0] ?? "friend";
  const tier = (profile?.subscription_tier as string | null) ?? "free";

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <span>☯</span> BaziSage
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {tier !== "free" && (
              <span className="badge badge-pro">{tier.toUpperCase()}</span>
            )}
            <form action="/api/auth/sign-out" method="POST">
              <button className="btn btn-ghost btn-sm" type="submit">Sign Out</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="container" style={{ padding: "3rem 1.5rem" }}>

        {/* Greeting */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ marginBottom: "0.5rem" }}>
            Welcome back, {firstName}
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Your Grandmaster is ready.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "2rem", alignItems: "start" }}>

          {/* Main: Charts */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem" }}>Your Charts</h2>
              <Link href="/onboarding" className="btn btn-primary btn-sm">
                + New Chart
              </Link>
            </div>

            {!charts || charts.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>☯</div>
                <h3 style={{ marginBottom: "0.75rem" }}>No charts yet</h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                  Create your first Bazi chart to begin your journey.
                </p>
                <Link href="/onboarding" className="btn btn-primary">
                  Read My Chart →
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {charts.map((chart) => (
                  <Link
                    key={chart.id as string}
                    href={`/chart/${chart.id as string}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div className="card card-gold" style={{
                      cursor: "pointer",
                      transition: "transform var(--transition-fast), box-shadow var(--transition-fast)",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div style={{
                            width: 56, height: 56,
                            borderRadius: "50%",
                            background: "radial-gradient(circle, rgba(201,168,76,0.2), transparent)",
                            border: "1px solid rgba(201,168,76,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "'Noto Serif SC', serif",
                            fontSize: "1.75rem",
                            color: "var(--gold)",
                          }}>
                            {chart.day_master as string}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                              {chart.subject_name as string}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                              Born {new Date(chart.birth_date as string).toLocaleDateString("en-US", {
                                year: "numeric", month: "long", day: "numeric"
                              })} ·{" "}
                              {(chart.day_master_element as string)} · {(chart.day_master_strength as string)}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          {(chart.mode as string) === "three_pillars" && (
                            <span className="badge badge-gold" style={{ fontSize: "0.65rem" }}>3 Pillars</span>
                          )}
                          <span style={{ color: "var(--text-muted)", fontSize: "1.25rem" }}>→</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Quick chat */}
            <div className="card card-jade">
              <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--text-secondary)" }}>
                🧠 Ask Your Grandmaster
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                Chat about your chart, current luck period, relationships, or career timing.
              </p>
              <Link href="/chat" className="btn btn-jade" style={{ width: "100%" }}>
                Open Chat →
              </Link>
            </div>

            {/* Upgrade CTA for free users */}
            {tier === "free" && (
              <div className="card" style={{
                background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(74,173,172,0.05))",
                borderColor: "rgba(201,168,76,0.25)",
              }}>
                <span className="badge badge-gold" style={{ marginBottom: "0.75rem" }}>
                  Upgrade to Pro
                </span>
                <h4 style={{ marginBottom: "0.75rem", fontSize: "1rem" }}>
                  Unlock Monthly Briefings
                </h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1rem" }}>
                  Get proactive monthly guidance, clash alerts, and unlimited Grandmaster sessions.
                </p>
                <Link href="/pricing" className="btn btn-primary btn-sm" style={{ width: "100%" }}>
                  See Plans →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
