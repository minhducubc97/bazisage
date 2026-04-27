"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
  name: string;
  birthDate: string;
  birthTimeKnown: boolean | null;
  birthTime: string;
  gender: "M" | "F" | "";
  locationName: string;
  longitude: number | null;
  latitude: number | null;
  timezone: string;
}

export interface OnboardingClientProps {
  editId?: string;
  initialData?: Partial<OnboardingData>;
}

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: "intro", title: "Meet Your Grandmaster" },
  { id: "name",  title: "Your Name" },
  { id: "date",  title: "Birth Date" },
  { id: "time",  title: "Birth Time" },
  { id: "place", title: "Birth Place" },
  { id: "gender", title: "Birth Gender" },
  { id: "ready", title: "Computing Your Chart" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingClient({ editId, initialData }: OnboardingClientProps = {}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: initialData?.name ?? "",
    birthDate: initialData?.birthDate ?? "",
    birthTimeKnown: initialData?.birthTimeKnown ?? null,
    birthTime: initialData?.birthTime ?? "",
    gender: initialData?.gender ?? "",
    locationName: initialData?.locationName ?? "",
    longitude: initialData?.longitude ?? null,
    latitude: initialData?.latitude ?? null,
    timezone: initialData?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const canAdvance = useCallback(() => {
    switch (step) {
      case 0: return true;
      case 1: return data.name.trim().length > 0;
      case 2: return data.birthDate.length === 10;
      case 3: return data.birthTimeKnown !== null &&
                (data.birthTimeKnown === false || data.birthTime.length === 5);
      case 4: return data.longitude !== null;
      case 5: return data.gender !== "";
      default: return false;
    }
  }, [step, data]);

  const advance = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    if (step === STEPS.length - 2) submitChart();
  };

  const submitChart = async () => {
    setIsLoading(true);
    try {
      // Compute the chart via the API (persists to Supabase if user is signed in)
      const utcOffsetMinutes = -new Date().getTimezoneOffset();
      const payload: any = {
        birthDate: data.birthDate,
        birthTime: data.birthTimeKnown ? data.birthTime : null,
        birthLocationName: data.locationName,
        longitude: data.longitude,
        latitude: data.latitude,
        gender: data.gender,
        timezone: data.timezone,
        utcOffsetMinutes,
        subjectName: data.name,
      };

      if (editId) payload.id = editId;

      const res = await fetch("/api/chart/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("chart compute failed");

      const json = await res.json() as { chartId?: string; persisted?: boolean };

      // If chart was saved (user is logged in), show their chart
      if (json.persisted && json.chartId) {
        router.push(`/chart/${json.chartId}`);
      } else {
        // Not logged in → go to login, then chat
        router.push("/auth/login?redirectTo=/dashboard");
      }
    } catch {
      // Fallback: show demo chart so the user isn't stuck
      router.push("/chart/demo");
    }
  };

  const updateData = (patch: Partial<OnboardingData>) =>
    setData(prev => ({ ...prev, ...patch }));

  const { id: stepId } = STEPS[step]!;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/" style={{ color: "var(--text-muted)", fontSize: "1.25rem" }}>←</Link>
        <div style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)", fontWeight: 700 }}>
          ☯ BaziSage
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: "var(--bg-border)", width: "100%" }}>
        <div style={{
          height: "100%",
          background: "linear-gradient(90deg, var(--gold-dim), var(--gold))",
          width: `${((step) / (STEPS.length - 1)) * 100}%`,
          transition: "width 0.5s ease",
        }} />
      </div>

      {/* Step content */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2rem 1.5rem",
      }}>
        <div style={{ width: "100%", maxWidth: "520px" }}>

          {/* Intro */}
          {stepId === "intro" && (
            <div className="animate-fade-in" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "5rem", marginBottom: "1.5rem" }}>☯</div>
              <h1 style={{ marginBottom: "1rem", fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}>
                Meet Your<br />
                <span className="text-gradient-gold">AI Grandmaster</span>
              </h1>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "0.75rem" }}>
                I&apos;ll calculate your Four Pillars of Destiny using True Solar Time —
                the same technique classical masters used — and then explain what it means
                for your life, career, and relationships.
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "2rem" }}>
                Takes about 2 minutes. Your data stays private.
              </p>
              <button className="btn btn-primary btn-lg" onClick={advance}>
                Let&apos;s Begin →
              </button>
            </div>
          )}

          {/* Name */}
          {stepId === "name" && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: "0.5rem" }}>What should I call you?</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9375rem" }}>
                Your name helps me personalise readings for you.
              </p>
              <div className="form-group">
                <label className="label" htmlFor="name-input">Your name</label>
                <input
                  id="name-input"
                  type="text"
                  className="input"
                  placeholder="e.g. Alex, Minh, 小雨..."
                  value={data.name}
                  onChange={e => updateData({ name: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && canAdvance() && advance()}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Birth Date */}
          {stepId === "date" && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: "0.5rem" }}>
                When were you born, {data.name.split(" ")[0]}?
              </h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9375rem" }}>
                Your birth date determines your Year, Month, and Day pillars.
                The Bazi year changes at LiChun (立春, ~Feb 4) — not January 1st.
              </p>
              <div className="form-group">
                <label className="label" htmlFor="birth-date">Date of birth</label>
                <input
                  id="birth-date"
                  type="date"
                  className="input"
                  value={data.birthDate}
                  onChange={e => updateData({ birthDate: e.target.value })}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          )}

          {/* Birth Time */}
          {stepId === "time" && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: "0.5rem" }}>Do you know your birth time?</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9375rem" }}>
                The Hour Pillar adds crucial depth to your chart — especially for career
                and relationships. But three strong pillars beats four uncertain ones.
              </p>

              {data.birthTimeKnown === null && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <button
                    id="btn-time-known"
                    className="btn btn-ghost"
                    style={{ justifyContent: "flex-start", padding: "1.25rem 1.5rem", textAlign: "left" }}
                    onClick={() => updateData({ birthTimeKnown: true })}
                  >
                    <span style={{ fontSize: "1.5rem" }}>⏰</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>Yes, I know my birth time</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                        4 pillars — full chart accuracy
                      </div>
                    </div>
                  </button>
                  <button
                    id="btn-time-unknown"
                    className="btn btn-ghost"
                    style={{ justifyContent: "flex-start", padding: "1.25rem 1.5rem", textAlign: "left" }}
                    onClick={() => {
                      updateData({ birthTimeKnown: false, birthTime: "" });
                    }}
                  >
                    <span style={{ fontSize: "1.5rem" }}>🌙</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>I don&apos;t know my exact time</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                        3 pillars — still very accurate
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {data.birthTimeKnown === true && (
                <div>
                  <div className="form-group">
                    <label className="label" htmlFor="birth-time">Birth time (local time)</label>
                    <input
                      id="birth-time"
                      type="time"
                      className="input"
                      value={data.birthTime}
                      onChange={e => updateData({ birthTime: e.target.value })}
                      autoFocus
                    />
                    <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      We&apos;ll correct this to True Solar Time using your birth location.
                    </p>
                  </div>
                  <button
                    style={{ color: "var(--text-muted)", fontSize: "0.85rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onClick={() => updateData({ birthTimeKnown: null })}
                  >
                    ← Change
                  </button>
                </div>
              )}

              {data.birthTimeKnown === false && (
                <div>
                  <div style={{
                    padding: "1rem 1.25rem",
                    background: "rgba(74,173,172,0.08)",
                    border: "1px solid rgba(74,173,172,0.2)",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "1rem",
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}>
                    ✓ Three Pillars mode selected. Your Year, Month, and Day pillars
                    will be calculated. Birth Time Rectification (coming soon) can
                    narrow down your Hour pillar later.
                  </div>
                  <button
                    style={{ color: "var(--text-muted)", fontSize: "0.85rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onClick={() => updateData({ birthTimeKnown: null })}
                  >
                    ← Change
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Birth Place */}
          {stepId === "place" && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: "0.5rem" }}>Where were you born?</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9375rem" }}>
                Your birth longitude is used to apply True Solar Time correction —
                the difference between local standard time and actual solar time at that location.
              </p>
              <LocationPicker
                value={data.locationName}
                onChange={(name, lat, lon, tz) =>
                  updateData({ locationName: name, latitude: lat, longitude: lon, timezone: tz })
                }
              />
            </div>
          )}

          {/* Gender */}
          {stepId === "gender" && (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: "0.5rem" }}>Birth gender?</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9375rem" }}>
                In Bazi, birth gender determines the direction your Luck Pillars run —
                forward or backward through the 60-cycle.
              </p>
              <div style={{ display: "flex", gap: "1rem" }}>
                {[
                  { value: "M" as const, label: "Male (男)", icon: "♂" },
                  { value: "F" as const, label: "Female (女)", icon: "♀" },
                ].map(g => (
                  <button
                    key={g.value}
                    id={`btn-gender-${g.value.toLowerCase()}`}
                    className="btn btn-ghost"
                    style={{
                      flex: 1, padding: "1.5rem",
                      borderColor: data.gender === g.value ? "var(--gold)" : undefined,
                      background: data.gender === g.value ? "rgba(201,168,76,0.08)" : undefined,
                      color: data.gender === g.value ? "var(--gold)" : undefined,
                      flexDirection: "column", gap: "0.5rem",
                    }}
                    onClick={() => updateData({ gender: g.value })}
                  >
                    <span style={{ fontSize: "2rem" }}>{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Computing */}
          {stepId === "ready" && (
            <div className="animate-fade-in" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "4rem", marginBottom: "2rem" }}>
                {isLoading ? (
                  <span style={{ animation: "qi-float 1.5s ease-in-out infinite", display: "inline-block" }}>☯</span>
                ) : "✨"}
              </div>
              <h2 style={{ marginBottom: "1rem" }}>
                {isLoading ? "Computing your chart…" : "Your chart is ready!"}
              </h2>
              {isLoading && (
                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  <ComputingSteps />
                </div>
              )}
            </div>
          )}

          {/* Next button */}
          {stepId !== "intro" && stepId !== "ready" && stepId !== "time" && (
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "2rem" }}
              disabled={!canAdvance()}
              onClick={advance}
            >
              {step === STEPS.length - 2 ? "Reveal My Chart →" : "Continue →"}
            </button>
          )}

          {stepId === "time" && data.birthTimeKnown !== null && (
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "2rem" }}
              disabled={!canAdvance()}
              onClick={advance}
            >
              Continue →
            </button>
          )}

          {/* Step counter */}
          {stepId !== "intro" && stepId !== "ready" && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "1.5rem" }}>
              Step {step} of {STEPS.length - 2}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LocationPicker ───────────────────────────────────────────────────────────
// Minimal geocoder using browser geolocation + open-meteo for timezone

function LocationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string, lat: number, lon: number, tz: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Array<{ name: string; lat: number; lon: number; tz: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState(false);

  const search = async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`
      );
      const json = await response.json() as {
        results?: Array<{ name: string; latitude: number; longitude: number; timezone: string; admin1?: string; country?: string }>;
      };
      setResults(
        (json.results ?? []).map(r => ({
          name: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
          lat: r.latitude,
          lon: r.longitude,
          tz: r.timezone,
        }))
      );
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      // Reverse geocode
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=&count=1&language=en&format=json`
      );
      void res; // we just use the coords directly
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const locName = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
      setQuery(locName);
      setSelected(true);
      onChange(locName, latitude, longitude, tz);
    });
  };

  return (
    <div>
      <div className="form-group" style={{ position: "relative" }}>
        <label className="label" htmlFor="location-input">City or town of birth</label>
        <input
          id="location-input"
          type="text"
          className="input"
          placeholder="e.g. Hanoi, Saigon, New York…"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setSelected(false);
            void search(e.target.value);
          }}
          autoFocus
        />
        {isSearching && (
          <div style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.8rem" }}>
            …
          </div>
        )}
      </div>

      {results.length > 0 && !selected && (
        <div style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--bg-border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          marginTop: "-0.5rem",
          marginBottom: "1rem",
        }}>
          {results.map(r => (
            <button
              key={`${r.lat}-${r.lon}`}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "0.875rem 1rem", background: "none", border: "none",
                cursor: "pointer", color: "var(--text-primary)",
                fontSize: "0.9rem", borderBottom: "1px solid var(--bg-border)",
                transition: "background var(--transition-fast)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-surface)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
              onClick={() => {
                setQuery(r.name);
                setSelected(true);
                setResults([]);
                onChange(r.name, r.lat, r.lon, r.tz);
              }}
            >
              <span style={{ color: "var(--gold)", marginRight: "0.5rem" }}>📍</span>
              {r.name}
            </button>
          ))}
        </div>
      )}

      <button
        className="btn btn-ghost btn-sm"
        type="button"
        onClick={detectLocation}
        style={{ gap: "0.5rem" }}
      >
        <span>📡</span>
        Use my current location
      </button>
    </div>
  );
}

// ─── Computing steps animation ────────────────────────────────────────────────

const COMPUTING_STEPS = [
  "Applying True Solar Time correction…",
  "Computing Year, Month, Day pillars…",
  "Deriving your Day Master…",
  "Calculating Luck Pillar timeline…",
  "Analysing Five Element balance…",
];

function ComputingSteps() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(c => Math.min(c + 1, COMPUTING_STEPS.length - 1));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem", textAlign: "left" }}>
      {COMPUTING_STEPS.slice(0, current + 1).map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.875rem" }}>
          <span style={{ color: "var(--gold)" }}>✓</span>
          <span style={{ color: i === current ? "var(--text-primary)" : "var(--text-muted)" }}>{s}</span>
        </div>
      ))}
    </div>
  );
}
