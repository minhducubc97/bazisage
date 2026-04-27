"use client";

import { useChat } from "ai/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface ChatPageProps {
  chartId: string;
  sessionId: string;
  chartSummary: {
    dayMaster: string;
    dayMasterElement: string;
    dayMasterStrength: string;
    subjectName: string;
  };
  initialMessages?: Array<{ id: string; role: "user" | "assistant"; content: string }>;
}

const STARTER_QUESTIONS = [
  "What does my Day Master say about how I handle pressure?",
  "Which career directions does my chart favour?",
  "What's my current Luck Pillar energy and how should I use it?",
  "How does the current year interact with my chart?",
  "What relationships does my chart naturally attract or struggle with?",
];

/**
 * Map a server error code (or raw error message) to copy safe to show users.
 * Never leak provider names, env-file references, or stack traces here.
 */
function friendlyChatError(message: string | undefined): string {
  const msg = message ?? "";
  if (msg.includes("AI_SERVICE_UNAVAILABLE")) {
    return "The Grandmaster is temporarily unavailable. Please try again in a few minutes.";
  }
  if (msg.includes("AI_RATE_LIMITED")) {
    return "Too many questions in a short window. Take a breath, then try again.";
  }
  if (msg.includes("AI_AUTH_ERROR") || msg.includes("401") || msg.includes("Unauthorized")) {
    return "Your session has expired. Please refresh the page.";
  }
  if (msg.includes("AI_TEMPORARY_ERROR")) {
    return "The Grandmaster lost their train of thought. Please try again.";
  }
  return "Connection error — please try again.";
}

export default function ChatClient({
  chartId,
  sessionId,
  chartSummary,
  initialMessages = [],
}: ChatPageProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showStarters, setShowStarters] = useState(initialMessages.length === 0);

  const [isClearing, setIsClearing] = useState(false);

  const { messages, setMessages, input, handleInputChange, handleSubmit, append, isLoading, error } = useChat({
    api: "/api/chat",
    body: { sessionId, chartId },
    initialMessages,
    onFinish: () => {
      setShowStarters(false);
    },
    onError: (err) => {
      console.error("[ChatClient] useChat error:", err);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendStarter = (question: string) => {
    setShowStarters(false);
    void append({ role: "user", content: question });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = document.getElementById("chat-form") as HTMLFormElement;
      form?.requestSubmit();
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to scrap this conversation and start over?")) return;
    setIsClearing(true);
    try {
      await fetch(`/api/chat?sessionId=${sessionId}`, { method: "DELETE" });
      setMessages([]);
      setShowStarters(true);
    } catch (err) {
      console.error("Failed to clear chat", err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid var(--bg-border)",
        background: "rgba(10,10,15,0.9)",
        backdropFilter: "blur(20px)",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/dashboard" style={{ color: "var(--text-muted)", fontSize: "1.25rem" }}>←</Link>
          <div>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              color: "var(--gold)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}>
              ☯ Grandmaster
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {chartSummary.subjectName} · {chartSummary.dayMaster} {chartSummary.dayMasterElement} · {chartSummary.dayMasterStrength}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {messages.length > 0 && (
            <button 
              onClick={handleClearChat} 
              disabled={isClearing || isLoading} 
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--danger)", opacity: 0.8 }}
            >
              {isClearing ? "Clearing..." : "Clear Chat"}
            </button>
          )}
          <Link href={`/chart/${chartId}`} className="btn btn-primary btn-sm">
            View Chart
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", padding: "1.5rem" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>

          {/* Welcome state */}
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem 0 2rem" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>☯</div>
              <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem" }}>
                Your Grandmaster is here
              </h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: "0" }}>
                Ask anything about your chart, your current energy, or what&apos;s ahead.
              </p>
            </div>
          )}

          {/* Starter questions */}
          {showStarters && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              marginBottom: "2rem",
            }}>
              {STARTER_QUESTIONS.map(q => (
                <button
                  key={q}
                  className="chat-starter-btn"
                  onClick={() => sendStarter(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Message list */}
          {messages.map(m => (
            <div
              key={m.id}
              style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column",
                alignItems: m.role === "user" ? "flex-end" : "flex-start" }}
            >
              {m.role === "assistant" && (
                <div style={{
                  fontSize: "0.7rem",
                  color: "var(--gold)",
                  marginBottom: "0.4rem",
                  letterSpacing: "0.1em",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}>
                  ☯ GRANDMASTER
                </div>
              )}
              <div className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"} style={{ 
                  color: "var(--text-primary)", 
                  fontSize: "0.9375rem",
                  lineHeight: 1.7,
                }}>
                  <div className="react-markdown-wrapper">
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p style={{ margin: "0 0 1rem 0", whiteSpace: "pre-wrap" }} {...props} />,
                        strong: ({ node, ...props }) => <strong style={{ color: "var(--text-primary)", fontWeight: 600 }} {...props} />,
                        ul: ({ node, ...props }) => <ul style={{ margin: "0 0 1rem 1.5rem" }} {...props} />,
                        li: ({ node, ...props }) => <li style={{ marginBottom: "0.5rem" }} {...props} />,
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
              <div className="chat-bubble-assistant" style={{ padding: "0.875rem 1.25rem" }}>
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6,
                      borderRadius: "50%",
                      background: "var(--gold)",
                      opacity: 0.6,
                      animation: `qi-float 1s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              padding: "0.75rem 1rem",
              background: "rgba(184,64,64,0.1)",
              border: "1px solid rgba(184,64,64,0.3)",
              borderRadius: "var(--radius-md)",
              color: "var(--danger)",
              fontSize: "0.875rem",
              marginBottom: "1rem",
            }}>
              {friendlyChatError(error.message)}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{
        borderTop: "1px solid var(--bg-border)",
        padding: "1rem 1.5rem",
        background: "var(--bg-base)",
        flexShrink: 0,
      }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <form id="chat-form" onSubmit={handleSubmit}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
              <textarea
                ref={inputRef}
                id="chat-input"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask your Grandmaster…"
                rows={1}
                style={{
                  flex: 1,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--bg-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem 1rem",
                  color: "var(--text-primary)",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.9375rem",
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.5,
                  maxHeight: "120px",
                  overflow: "auto",
                  transition: "border-color var(--transition-fast)",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "var(--gold)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "var(--bg-border)"; }}
                disabled={isLoading}
              />
              <button
                id="chat-submit"
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !input.trim()}
                style={{ flexShrink: 0, alignSelf: "flex-end" }}
              >
                {isLoading ? "…" : "→"}
              </button>
            </div>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.5rem", textAlign: "center" }}>
              Enter to send · Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
