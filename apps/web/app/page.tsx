import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BaziSage — Your AI Bazi Grandmaster",
  description:
    "Not just a calculator. A persistent AI Grandmaster who knows your chart deeply and guides you proactively through life's turning points.",
};

const ELEMENT_CIRCLES = [
  { char: "木", name: "Wood", color: "#5A8F5A", delay: "0s" },
  { char: "火", name: "Fire",  color: "#B84040", delay: "1s" },
  { char: "土", name: "Earth", color: "#B08A4C", delay: "2s" },
  { char: "金", name: "Metal", color: "#C0C0CC", delay: "3s" },
  { char: "水", name: "Water", color: "#3A5A7A", delay: "4s" },
];

const FEATURES = [
  {
    icon: "⏱",
    title: "True Solar Time Accuracy",
    body: "Most Bazi apps use the wrong birth time. We apply longitude correction and the Equation of Time so your chart is calculated to the minute — not the timezone.",
  },
  {
    icon: "🧠",
    title: "Persistent AI Grandmaster",
    body: "Not a chatbot that forgets you. Your Grandmaster remembers every conversation, life event, and question — building a relationship over months and years.",
  },
  {
    icon: "📅",
    title: "Proactive Life Guidance",
    body: "Monthly briefings and personal clash alerts reach you before critical days arrive. The Grandmaster watches your chart so you don't have to.",
  },
  {
    icon: "🎓",
    title: "Learn While You Explore",
    body: "Every reading includes expandable '💡 Learn' panels. You'll understand your own chart within weeks, not years of study.",
  },
];

const STATS = [
  { value: "100+", label: "Validated golden test cases" },
  { value: "3 sec", label: "Full chart in True Solar Time" },
  { value: "30", label: "Personalized daily advice templates" },
  { value: "8 wk", label: "From idea to launch" },
];

const TESTIMONIALS = [
  {
    quote: "The monthly briefing warned me about a 午 clash in August — I moved my contract signing one week later. The deal went through without a hitch.",
    name: "Minh D.", role: "Entrepreneur",
  },
  {
    quote: "Every Bazi tool I've used before was basically a static wheel. This feels like having a grandmaster on call — one who actually remembers our last conversation.",
    name: "Linh T.", role: "Product Lead",
  },
];

export default function LandingPage() {
  return (
    <main style={{ position: "relative", zIndex: 1 }}>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">
            <span style={{ fontSize: "1.5rem" }}>☯</span>
            BaziSage
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <Link href="/about" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              About
            </Link>
            <Link href="/pricing" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Pricing
            </Link>
            <Link href="/auth/login" className="btn btn-ghost btn-sm">
              Sign In
            </Link>
            <Link href="/onboarding" className="btn btn-primary btn-sm">
              Read My Chart
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: "7rem", paddingBottom: "5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Floating element circles - Moved to background layer to prevent text overlapping */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)", width: "100%", height: "100%",
          maxWidth: "1200px",
          pointerEvents: "none", zIndex: 0,
        }}>
          {ELEMENT_CIRCLES.map((el, i) => (
            <div
              key={el.name}
              style={{
                position: "absolute",
                width: "80px", height: "80px",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${el.color}25, transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-noto-sc), serif",
                fontSize: "1.5rem",
                color: el.color,
                left: `${15 + i * 17}%`,
                top: `${20 + (i % 2 === 0 ? 10 : 40)}%`,
                animation: `qi-float ${4 + i * 0.5}s ease-in-out infinite`,
                animationDelay: el.delay,
                opacity: 0.15,
                filter: "blur(2px)",
              }}
            >
              {el.char}
            </div>
          ))}
        </div>

        <div className="container-narrow animate-fade-in" style={{ position: "relative", zIndex: 1 }}>
          <div className="badge badge-gold" style={{ margin: "0 auto 1.5rem", display: "inline-flex" }}>
            Private Beta — Limited Access
          </div>

          <h1 style={{ marginBottom: "1.5rem", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
            Your{" "}
            <span className="text-gradient-gold">AI Grandmaster</span>
            <br />
            in Your Pocket
          </h1>

          <p style={{
            fontSize: "1.15rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "2.5rem",
            maxWidth: "560px",
            margin: "0 auto 2.5rem",
          }}>
              Authentic Bazi readings with True Solar Time precision. A persistent AI
              advisor who knows your chart, remembers your life, and reaches out
              <em> before</em> critical moments arrive.
            </p>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/onboarding" className="btn btn-primary btn-lg animate-glow-pulse">
                Read My Chart Free →
              </Link>
              <Link href="#how-it-works" className="btn btn-ghost btn-lg">
                See How It Works
              </Link>
            </div>

            <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              No credit card required · Instant results
            </p>
          </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <section style={{
        borderTop: "1px solid var(--bg-border)",
        borderBottom: "1px solid var(--bg-border)",
        padding: "2rem 0",
        background: "var(--bg-surface)",
      }}>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "2rem",
            textAlign: "center",
          }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--gold)", fontFamily: "'Cinzel', serif" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="section" id="how-it-works">
        <div className="container">
          <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
            Built Different
          </h2>
          <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "4rem", maxWidth: "500px", margin: "0 auto 4rem" }}>
            Every design decision optimises for one thing: a reading you can actually trust and use.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`card card-gold animate-fade-in stagger-${i + 1}`}
                style={{ opacity: 0 }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{f.icon}</div>
                <h4 style={{ marginBottom: "0.75rem", color: "var(--text-primary)" }}>{f.title}</h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.65 }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Chart preview mockup ─────────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--bg-surface)" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "4rem", alignItems: "center" }}>

          <div>
              <div className="badge badge-jade" style={{ marginBottom: "1.5rem" }}>
                Your Four Pillars
              </div>
              <h2 style={{ marginBottom: "1rem" }}>
                See Your Chart<br />
                <span className="text-gradient-jade">In Minutes</span>
              </h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.7 }}>
                Enter your birth details and receive your complete Four Pillars chart,
                Day Master analysis, element balance, and Luck Pillar timeline —
                all computed with True Solar Time precision.
              </p>
              <Link href="/onboarding" className="btn btn-primary">
                Get My Free Reading →
              </Link>
            </div>

            {/* Chart preview card */}
            <div className="card card-gold animate-glow-pulse">
              <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="badge badge-gold">庚 Metal · Day Master</span>
                <span className="badge badge-metal">Yang · Strong</span>
              </div>

              {/* Fake 4 pillars grid */}
              <div className="pillar-grid" style={{ marginBottom: "1.5rem" }}>
                {[
                  { label: "Hour", stem: "壬", branch: "午", color: "#3A5A7A", branchColor: "#B84040" },
                  { label: "Day ✦", stem: "庚", branch: "辰", color: "#C0C0CC", branchColor: "#B08A4C", isDM: true },
                  { label: "Month", stem: "辛", branch: "巳", color: "#C0C0CC", branchColor: "#B84040" },
                  { label: "Year", stem: "庚", branch: "午", color: "#C0C0CC", branchColor: "#B84040" },
                ].map(p => (
                  <div key={p.label} className={`pillar-cell${p.isDM ? " day-master" : ""}`}>
                    <span className="pillar-label">{p.label}</span>
                    <span className="pillar-stem" style={{ color: p.color }}>{p.stem}</span>
                    <div className="divider" style={{ margin: "0.25rem 0" }} />
                    <span className="pillar-branch" style={{ color: p.branchColor }}>{p.branch}</span>
                  </div>
                ))}
              </div>

              {/* Element bars */}
              <div className="element-bars">
                {[
                  { name: "Metal", pct: 40, color: "var(--element-metal)" },
                  { name: "Fire",  pct: 35, color: "var(--element-fire)" },
                  { name: "Earth", pct: 15, color: "var(--element-earth)" },
                  { name: "Water", pct: 7,  color: "#6A9FCC" },
                  { name: "Wood",  pct: 3,  color: "var(--element-wood)" },
                ].map(el => (
                  <div key={el.name} className="element-bar-row">
                    <span className="element-bar-label">{el.name}</span>
                    <div className="element-bar-track">
                      <div
                        className="element-bar-fill"
                        style={{ width: `${el.pct}%`, background: el.color }}
                      />
                    </div>
                    <span className="element-bar-pct">{el.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container-narrow">
          <h2 style={{ textAlign: "center", marginBottom: "3rem" }}>
            What Early Users Say
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card">
                <p style={{
                  color: "var(--text-primary)",
                  fontSize: "1.05rem",
                  lineHeight: 1.7,
                  marginBottom: "1rem",
                  fontStyle: "italic",
                }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--gold-dim), var(--gold))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", fontWeight: 700, color: "var(--bg-base)",
                  }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.name}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section style={{
        background: "linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(74,173,172,0.06) 100%)",
        borderTop: "1px solid var(--bg-border)",
        borderBottom: "1px solid var(--bg-border)",
        padding: "5rem 0",
        textAlign: "center",
      }}>
        <div className="container-narrow">
          <span style={{ fontSize: "3rem" }}>☯</span>
          <h2 style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            Your chart is waiting.
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2.5rem", fontSize: "1.1rem" }}>
            It takes two minutes. The insights last a lifetime.
          </p>
          <Link href="/onboarding" className="btn btn-primary btn-lg animate-glow-pulse">
            Read My Chart — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{
        padding: "2rem 0",
        borderTop: "1px solid var(--bg-border)",
        color: "var(--text-muted)",
        fontSize: "0.8rem",
      }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)", opacity: 0.8 }}>
            ☯ BaziSage
          </div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/privacy" style={{ color: "var(--text-muted)" }}>Privacy</Link>
            <Link href="/terms" style={{ color: "var(--text-muted)" }}>Terms</Link>
            <Link href="/blog" style={{ color: "var(--text-muted)" }}>Blog</Link>
          </div>
          <div>© 2025 BaziSage. All rights reserved.</div>
        </div>
      </footer>

    </main>
  );
}
