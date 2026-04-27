import type { Metadata } from "next";
import Link from "next/link";
import { computeChart } from "@bazisage/bazi-core";

export const metadata: Metadata = {
  title: "Demo Chart — BaziSage",
  description: "A demo Bazi chart computed by the BaziSage engine.",
};

// Demo chart: 1990-05-15, 11:30, Hanoi — validated against tyme4ts
function getDemoChart() {
  return computeChart(
    {
      birthDate: "1990-05-15",
      birthTime: "11:30",
      birthLocationName: "Hanoi, Vietnam",
      longitude: 105.85,
      latitude: 21.03,
      gender: "M",
    },
    "Asia/Ho_Chi_Minh",
    420
  );
}

const ELEMENT_COLORS: Record<string, string> = {
  Wood:  "var(--element-wood)",
  Fire:  "var(--element-fire)",
  Earth: "var(--element-earth)",
  Metal: "var(--element-metal)",
  Water: "#6A9FCC",
};

const TEN_GOD_EN: Record<string, string> = {
  "比肩": "Friend",   "劫财": "Rob Wealth",
  "食神": "Eating God","伤官": "Hurting Officer",
  "偏财": "Indirect Wealth","正财": "Direct Wealth",
  "七杀": "7 Killings","正官": "Direct Officer",
  "偏印": "Indirect Resource","正印": "Direct Resource",
};

export default function DemoChartPage() {
  const { chart } = getDemoChart();
  const pillars = [
    { label: "Hour", pillar: chart.hourPillar, tenGod: chart.tenGods.hourStem },
    { label: "Day ✦", pillar: chart.dayPillar, tenGod: null, isDM: true },
    { label: "Month", pillar: chart.monthPillar, tenGod: chart.tenGods.monthStem },
    { label: "Year", pillar: chart.yearPillar, tenGod: chart.tenGods.yearStem },
  ];
  const elementBalance = chart.elementBalance;

  return (
    <main style={{ position: "relative", zIndex: 1 }}>
      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <span>☯</span> BaziSage
          </Link>
          <Link href="/onboarding" className="btn btn-primary btn-sm">
            Read My Chart
          </Link>
        </div>
      </nav>

      <div className="container" style={{ padding: "3rem 1.5rem" }}>

        {/* Header */}
        <div className="animate-fade-in" style={{ marginBottom: "2.5rem" }}>
          <div className="badge badge-gold" style={{ marginBottom: "1rem" }}>
            Demo Chart
          </div>
          <h1 style={{ marginBottom: "0.5rem" }}>
            Minh&apos;s Bazi Chart
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Born 15 May 1990, 11:30 · Hanoi, Vietnam ·{" "}
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              True Solar offset: +{chart.trueSolarOffsetMinutes} min
            </span>
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", alignItems: "start" }}>

          {/* Left column */}
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
                      <span
                        className="pillar-stem"
                        style={{ color: ELEMENT_COLORS[pillar.stemElement] }}
                      >
                        {pillar.stem}
                      </span>
                      <div className="divider" style={{ margin: "0.25rem 0" }} />
                      <span
                        className="pillar-branch"
                        style={{ color: ELEMENT_COLORS[pillar.branchElement] }}
                      >
                        {pillar.branch}
                      </span>
                      <span className="pillar-element-tag">
                        {pillar.stemElement} / {pillar.branchElement}
                      </span>
                      {/* Hidden stems */}
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "center", marginTop: "0.25rem" }}>
                        {pillar.hiddenStems.map(hs => (
                          <span key={hs} style={{
                            fontSize: "0.7rem", padding: "1px 5px",
                            background: "var(--bg-border)",
                            borderRadius: "3px", color: "var(--text-muted)",
                            fontFamily: "'Noto Serif SC', serif",
                          }}>
                            {hs}
                          </span>
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
                  width: 80, height: 80, borderRadius: "50%",
                  background: `radial-gradient(circle, ${ELEMENT_COLORS[chart.dayMasterElement]}30, transparent)`,
                  border: `2px solid ${ELEMENT_COLORS[chart.dayMasterElement]}60`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: "2.5rem",
                  color: ELEMENT_COLORS[chart.dayMasterElement],
                  flexShrink: 0,
                }}>
                  {chart.dayMaster}
                </div>
                <div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    <span className="badge" style={{
                      background: `${ELEMENT_COLORS[chart.dayMasterElement]}20`,
                      color: ELEMENT_COLORS[chart.dayMasterElement],
                    }}>
                      {chart.dayMasterPolarity} {chart.dayMasterElement}
                    </span>
                    <span className="badge badge-gold">{chart.dayMasterStrength}</span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.65 }}>
                    Your Day Master is <strong style={{ color: "var(--text-primary)" }}>
                      {chart.dayMaster} ({chart.dayMasterPolarity} {chart.dayMasterElement})
                    </strong> — classified as <strong style={{ color: "var(--gold)" }}>
                      {chart.dayMasterStrength}
                    </strong>. Your Useful God is{" "}
                    <strong style={{ color: ELEMENT_COLORS[chart.usefulGod] }}>
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
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--bg-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.75rem",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      Age {lp.startAge}–{lp.endAge}
                    </div>
                    <div style={{
                      fontFamily: "'Noto Serif SC', serif",
                      fontSize: "1.25rem",
                      color: ELEMENT_COLORS[lp.pillar.stemElement],
                    }}>
                      {lp.pillar.stem}
                    </div>
                    <div style={{
                      fontFamily: "'Noto Serif SC', serif",
                      fontSize: "1.25rem",
                      color: ELEMENT_COLORS[lp.pillar.branchElement],
                    }}>
                      {lp.pillar.branch}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      {lp.startYear}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Element Balance */}
            <div className="card card-jade animate-fade-in stagger-1">
              <h3 style={{ marginBottom: "1.25rem", fontSize: "1rem", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
                五行 · ELEMENTS
              </h3>
              <div className="element-bars">
                {(["Metal","Fire","Earth","Water","Wood"] as const).map(el => {
                  const pct = elementBalance[el];
                  return (
                    <div key={el} className="element-bar-row">
                      <span className="element-bar-label" style={{ color: ELEMENT_COLORS[el] }}>
                        {el}
                      </span>
                      <div className="element-bar-track">
                        <div
                          className="element-bar-fill"
                          style={{ width: `${pct}%`, background: ELEMENT_COLORS[el] }}
                        />
                      </div>
                      <span className="element-bar-pct">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Useful God */}
            <div className="card animate-fade-in stagger-2">
              <h3 style={{ marginBottom: "1rem", fontSize: "1rem", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
                用神 · USEFUL GOD
              </h3>
              <div style={{
                textAlign: "center",
                padding: "1rem",
                background: `radial-gradient(circle, ${ELEMENT_COLORS[chart.usefulGod]}15, transparent)`,
                border: `1px solid ${ELEMENT_COLORS[chart.usefulGod]}30`,
                borderRadius: "var(--radius-md)",
              }}>
                <div style={{
                  fontSize: "1.5rem",
                  color: ELEMENT_COLORS[chart.usefulGod],
                  fontWeight: 700,
                  marginBottom: "0.5rem",
                }}>
                  {chart.usefulGod}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Your favourable element — seek environments, careers, and
                  partnerships that amplify this energy.
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="card" style={{
              background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(74,173,172,0.05))",
              borderColor: "rgba(201,168,76,0.2)",
            }}>
              <h4 style={{ marginBottom: "0.75rem" }}>
                Understand Your Chart
              </h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                This is a demo. Your own chart will include a full AI reading,
                monthly briefings, and a persistent Grandmaster who remembers your journey.
              </p>
              <Link href="/onboarding" className="btn btn-primary" style={{ width: "100%" }}>
                Read My Real Chart →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
