"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectTo }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Something went wrong. Try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    const res = await fetch("/api/auth/oauth?provider=google", { method: "POST" });
    const data = await res.json() as { url?: string; error?: string };
    if (data.url) window.location.href = data.url;
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}>
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
                Click it to sign in — no password needed.
              </p>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: "1.5rem" }}
                onClick={() => setSent(false)}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ textAlign: "center", marginBottom: "2rem", fontSize: "1.5rem" }}>
                Welcome back
              </h2>

              {/* Google OAuth */}
              <button
                id="btn-google-login"
                className="btn btn-ghost"
                style={{ width: "100%", marginBottom: "1.25rem" }}
                onClick={handleGoogle}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                <div className="divider" style={{ margin: 0, flex: 1 }} />
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>or use email</span>
                <div className="divider" style={{ margin: 0, flex: 1 }} />
              </div>

              <form onSubmit={handleMagicLink}>
                <div className="form-group">
                  <label className="label" htmlFor="login-email">Email address</label>
                  <input
                    id="login-email"
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p style={{ color: "var(--danger)", fontSize: "0.875rem", marginBottom: "1rem" }}>
                    {error}
                  </p>
                )}

                <button
                  id="btn-magic-link"
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  disabled={isLoading || !email}
                >
                  {isLoading ? "Sending…" : "Send Magic Link ✨"}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "1.5rem" }}>
          No account yet?{" "}
          <Link href="/onboarding" style={{ color: "var(--jade)" }}>
            Start with a free reading
          </Link>
        </p>

      </div>
    </div>
  );
}
