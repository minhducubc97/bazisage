import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { BaziChart } from "@bazisage/bazi-core";

export const metadata: Metadata = { title: "My Bazi Chart" };

const ELEMENT_COLORS: Record<string, string> = {
  Wood:  "#5A8F5A",
  Fire:  "#B84040",
  Earth: "#B08A4C",
  Metal: "#C0C0CC",
  Water: "#6A9FCC",
};

const TEN_GOD_EN: Record<string, string> = {
  "比肩": "Friend",      "劫财": "Rob Wealth",
  "食神": "Eating God",  "伤官": "Hurting Officer",
  "偏财": "Ind. Wealth", "正财": "Dir. Wealth",
  "七杀": "7 Killings",  "正官": "Dir. Officer",
  "偏印": "Ind. Resource","正印": "Dir. Resource",
};

export default async function ChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/auth/login?redirectTo=/chart/${id}`);

  const { data: row } = await supabase
    .from("bazi_charts")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!row) notFound();

  const chart = row.chart_data as BaziChart;
  const pillars = [
    { label: "Hour", pillar: chart.hourPillar, tenGod: chart.tenGods?.hourStem },
    { label: "Day ✦", pillar: chart.dayPillar, tenGod: null, isDM: true },
    { label: "Month", pillar: chart.monthPillar, tenGod: chart.tenGods?.monthStem },
    { label: "Year",  pillar: chart.yearPillar,  tenGod: chart.tenGods?.yearStem },
  ];

  return (
    <main>
      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/dashboard" className="nav-logo">← Dashboard</Link>
          <Link href={`/chat?chartId=${id}`} className="btn btn-primary btn-sm">
            Chat with Grandmaster →
          </Link>
        </div>
      </nav>

      <div className="container" style={{ padding: "3rem 1.5rem" }}>
        {/* Header */}
        <div className="animate-fade-in" style={{ marginBottom: "2.5rem" }}>
          <div className="badge badge-gold" style={{ marginBottom: "1rem" }}>Your Chart</div>
          <h1 style={{ marginBottom: "0.5rem" }}>{row.subject_name as string}&apos;s Bazi Chart</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Born {new Date(row.birth_date as string).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric"
            })}
            {row.birth_time ? ` at ${row.birth_time as string}` : ""} ·{" "}
            {row.birth_location_name as string} ·{" "}
            <span style={{ color: "var(--text-muted)" }}>
              True Solar offset: {chart.trueSolarOffsetMinutes > 0 ? "+" : ""}{chart.trueSolarOffsetMinutes} min
            </span>
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "2rem", alignItems: "start" }}>
          <div>
            {/* Four Pillars */}
            <section className="card card-gold animate-fade-in" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ marginBottom: "1.5rem", fontSize: "1rem", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                四柱命盤 · FOUR PILLARS
              </h3>
              <div className="pillar-grid">
                {pillars.map(({ label, pillar, tenGod, isDM }) => {
                  if (!pillar) return (
                    <div key={label} className="pillar-cell">
                      <span className="pillar-label">{label}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Unknown</span>
                    </div>
                  );
                  return (
                    <div key={label} className={`pillar-cell${isDM ? " day-master" : ""}`}>
                      <span className="pillar-label">{label}</span>
                      {tenGod && (
                        <span style={{ fontSize: "0.65rem", color: "var(--gold)", letterSpacing: "0.08em" }}>
                          {tenGod} · {TEN_GOD_EN[tenGod]}
                        </span>
                      )}
                      <span className="pillar-stem" style={{ color: ELEMENT_COLORS[pillar.stemElement] }}>
                        {pillar.stem}
                      </span>
                      <div className="divider" style={{ margin: "0.25rem 0" }} />
                      <span className="pillar-branch" style={{ color: ELEMENT_COLORS[pillar.branchElement] }}>
                        {pillar.branch}
                      </span>
                      <span className="pillar-element-tag">{pillar.stemElement} / {pillar.branchElement}</span>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginTop: "0.25rem" }}>
                        {pillar.hiddenStems.map(hs => (
                          <span key={hs} style={{
                            fontSize: "0.7rem", padding: "1px 5px",
                            background: "var(--bg-border)", borderRadius: 3,
                            color: "var(--text-muted)", fontFamily: "'Noto Serif SC', serif",
                          }}>{hs}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Day Master */}
            <section className="card animate-fade-in stagger-1" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ marginBottom: "1.25rem", fontSize: "1rem", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
                日主分析 · DAY MASTER
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
                  background: `radial-gradient(circle, ${ELEMENT_COLORS[chart.dayMasterElement]}30, transparent)`,
                  border: `2px solid ${ELEMENT_COLORS[chart.dayMasterElement]}60`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Noto Serif SC', serif", fontSize: "2.5rem",
                  color: ELEMENT_COLORS[chart.dayMasterElement],
                }}>
                  {chart.dayMaster}
                </div>
                <div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    <span className="badge" style={{ background: `${ELEMENT_COLORS[chart.dayMasterElement]}20`, color: ELEMENT_COLORS[chart.dayMasterElement] }}>
                      {chart.dayMasterPolarity} {chart.dayMasterElement}
                    </span>
                    <span className="badge badge-gold">{chart.dayMasterStrength}</span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.65 }}>
                    Your Day Master is <strong style={{ color: "var(--text-primary)" }}>
                      {chart.dayMaster} ({chart.dayMasterPolarity} {chart.dayMasterElement})
                    </strong> — classified as <strong style={{ color: "var(--gold)" }}>
                      {chart.dayMasterStrength}
                    </strong>. Useful God: <strong style={{ color: ELEMENT_COLORS[chart.usefulGod] }}>
                      {chart.usefulGod}
                    </strong>.
                  </p>
                </div>
              </div>
            </section>

            {/* Luck Pillars */}
            <section className="card animate-fade-in stagger-2">
              <h3 style={{ marginBottom: "1.25rem", fontSize: "1rem", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
                大运 · LUCK PILLARS
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.75rem" }}>
                {chart.luckPillars.map((lp, i) => (
                  <div key={i} style={{
                    background: "var(--bg-elevated)", border: "1px solid var(--bg-border)",
                    borderRadius: "var(--radius-sm)", padding: "0.75rem", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      Age {lp.startAge}–{lp.endAge}
                    </div>
                    <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.25rem", color: ELEMENT_COLORS[lp.pillar.stemElement] }}>
                      {lp.pillar.stem}
                    </div>
                    <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.25rem", color: ELEMENT_COLORS[lp.pillar.branchElement] }}>
                      {lp.pillar.branch}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{lp.startYear}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Elements */}
            <div className="card card-jade animate-fade-in stagger-1">
              <h3 style={{ marginBottom: "1.25rem", fontSize: "1rem", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
                五行 · ELEMENTS
              </h3>
              <div className="element-bars">
                {(["Metal","Fire","Earth","Water","Wood"] as const).map(el => (
                  <div key={el} className="element-bar-row">
                    <span className="element-bar-label" style={{ color: ELEMENT_COLORS[el] }}>{el}</span>
                    <div className="element-bar-track">
                      <div className="element-bar-fill" style={{ width: `${chart.elementBalance[el]}%`, background: ELEMENT_COLORS[el] }} />
                    </div>
                    <span className="element-bar-pct">{chart.elementBalance[el]}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat CTA */}
            <div className="card card-gold animate-fade-in stagger-2">
              <h4 style={{ marginBottom: "0.75rem" }}>Talk to Your Grandmaster</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                Ask about your chart, career timing, relationships, or what your current Luck Pillar means for you.
              </p>
              <Link href={`/chat?chartId=${id}`} className="btn btn-primary" style={{ width: "100%" }}>
                Open Chat →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
