"use client";

import { useEffect, useRef } from "react";
import { useCompletion } from "ai/react";

interface AIOverviewCardProps {
  chartId: string;
  initialReading?: string;
}

export function AIOverviewCard({ chartId, initialReading }: AIOverviewCardProps) {
  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/chart/reading",
    initialCompletion: initialReading || "",
  });

  const initialized = useRef(false);

  useEffect(() => {
    // If no initial reading exists, automatically trigger the generation on mount.
    if (!initialReading && !initialized.current) {
      initialized.current = true;
      complete("", { body: { chartId } });
    }
  }, [initialReading, chartId, complete]);

  // Format paragraphs neatly
  const renderContent = (text: string) => {
    return text.split("\n\n").map((para, idx) => {
      if (!para.trim()) return null;
      const parts = para.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={idx} style={{ marginBottom: "1rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>
          {parts.map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ color: "var(--text-primary)" }}>{part}</strong> : part))}
        </p>
      );
    });
  };

  const hasContent = completion.length > 0;

  return (
    <section className="card animate-fade-in stagger-3" style={{ 
      marginBottom: "2rem",
      background: "linear-gradient(180deg, var(--bg-elevated) 0%, rgba(20,20,20,0) 100%)",
      borderTop: "1px solid var(--gold)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative gradient orb */}
      <div style={{
        position: "absolute", top: -50, right: -50, width: 150, height: 150,
        background: "var(--gold)", filter: "blur(100px)", opacity: 0.1, pointerEvents: "none"
      }} />

      <h3 style={{ marginBottom: "1.25rem", fontSize: "1rem", color: "var(--gold)", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>❇</span> GRANDMASTER&apos;s IMPRESSION
      </h3>

      {isLoading && !hasContent && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}>
          <div style={{ height: 12, background: "var(--bg-border)", borderRadius: 4, width: "100%" }} />
          <div style={{ height: 12, background: "var(--bg-border)", borderRadius: 4, width: "95%" }} />
          <div style={{ height: 12, background: "var(--bg-border)", borderRadius: 4, width: "85%" }} />
          <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
            The Grandmaster is studying your chart...
          </div>
        </div>
      )}

      {error ? (
        <div style={{ color: "#ff6b6b", padding: "1rem", background: "rgba(255,107,107,0.1)", borderRadius: "var(--radius-sm)" }}>
          <p>The Grandmaster is meditating right now and could not be reached.</p>
          <button onClick={() => complete("", { body: { chartId } })} className="btn btn-sm" style={{ marginTop: "0.5rem" }}>
            Try Again
          </button>
        </div>
      ) : (
        <div className="overview-content">
          {renderContent(completion)}
          {isLoading && hasContent && (
            <span style={{ 
              display: "inline-block",
              width: "8px", height: "16px", background: "var(--gold)",
              animation: "blink 1s step-end infinite",
              marginLeft: "4px", verticalAlign: "middle"
            }} />
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blink { 50% { opacity: 0; } }
      `}} />
    </section>
  );
}
