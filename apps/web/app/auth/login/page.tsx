"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Mode = "magic" | "password";

// Separated into inner component so useSearchParams() is inside <Suspense>
function LoginContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectTo }),
      });
      if (res.ok) { setSent(true); }
      else { const d = await res.json() as { error?: string }; setError(d.error ?? "Something went wrong."); }
    } catch { setError("Network error. Please try again."); }
    finally { setIsLoading(false); }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, redirectTo }),
      });
      const d = await res.json() as { ok?: boolean; url?: string; error?: string };
      if (d.ok && d.url) { window.location.href = d.url; }
      else { setError(d.error ?? "Invalid email or password."); }
    } catch { setError("Network error. Please try again."); }
    finally { setIsLoading(false); }
  };

  const handleGoogle = async () => {
    const res = await fetch("/api/auth/oauth?provider=google", { method: "POST" });
    const data = await res.json() as { url?: string; error?: string };
    if (data.url) window.location.href = data.url;
    else setError(data.error ?? "Google sign-in unavailable.");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <span>☯</span> BaziSage
            </div>
          </Link>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.875rem" }}>
            Sign in to save your chart and access your Grandmaster
          </p>
        </div>

        <div className="card card-gold animate-fade-in">
          {sent ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📬</div>
              <h3 style={{ marginBottom: "0.75rem" }}>Check your inbox</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6 }}>
                We sent a magic link to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
              </p>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: "1.5rem" }} onClick={() => setSent(false)}>
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ textAlign: "center", marginBottom: "2rem", fontSize: "1.5rem" }}>Welcome back</h2>

              {/* Google */}
              <button id="btn-google-login" className="btn btn-ghost" style={{ width: "100%", marginBottom: "1.25rem" }} onClick={handleGoogle}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Mode tabs */}
              <div style={{ display: "flex", marginBottom: "1.25rem", border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                {(["magic", "password"] as Mode[]).map(m => (
                  <button key={m} onClick={() => { setMode(m); setError(""); }}
                    style={{ flex: 1, padding: "0.5rem", fontSize: "0.8rem", cursor: "pointer", border: "none",
                      background: mode === m ? "var(--bg-elevated)" : "transparent",
                      color: mode === m ? "var(--gold)" : "var(--text-muted)",
                      transition: "all var(--transition-fast)",
                    }}>
                    {m === "magic" ? "✨ Magic Link" : "🔑 Password"}
                  </button>
                ))}
              </div>

              {error && <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "1rem" }}>{error}</p>}

              {mode === "magic" && (
                <form onSubmit={handleMagicLink}>
                  <div className="form-group">
                    <label className="label" htmlFor="login-email">Email address</label>
                    <input id="login-email" type="email" className="input" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                  </div>
                  <button id="btn-magic-link" type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={isLoading || !email}>
                    {isLoading ? "Sending…" : "Send Magic Link ✨"}
                  </button>
                </form>
              )}

              {mode === "password" && (
                <form onSubmit={handlePassword}>
                  <div className="form-group">
                    <label className="label" htmlFor="login-email-pw">Email address</label>
                    <input id="login-email-pw" type="email" className="input" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="label" htmlFor="login-password">Password</label>
                    <input id="login-password" type="password" className="input" placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <button id="btn-password-login" type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={isLoading || !email || !password}>
                    {isLoading ? "Signing in…" : "Sign In →"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "1.5rem" }}>
          No account yet?{" "}
          <Link href="/onboarding" style={{ color: "var(--jade)" }}>Start with a free reading</Link>
        </p>
      </div>
    </div>
  );
}

// useSearchParams() must be inside <Suspense> in Next.js 15
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--gold)", fontFamily: "'Cinzel', serif" }}>☯</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
