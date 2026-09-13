"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";

/* ── Minimal SVG line icons matching Owner Dashboard ── */
function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  check: "M20 6L9 17l-5-5",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
};

const PROMPT_SUGGESTIONS = [
  "How do I submit the death certificate to claim assets?",
  "What documents do I need to claim life insurance?",
  "Can I transfer the bank fixed deposit without probate?",
  "How does the multi-signature crypto release work?",
  "What is the role of the primary nominee versus other legal heirs?",
];

const SCOPE_ITEMS = [
  { title: "Claims & Release", desc: "Death certificate verification and asset unlocking steps" },
  { title: "Legal & Probate", desc: "Understanding wills, succession certificates, and NOCs" },
  { title: "Asset Credentials", desc: "How to safely handle released passwords and account keys" },
  { title: "Bank & Insurance", desc: "Specific claim forms and municipal authority procedures" },
];

export default function NomineeAssistantPage() {
  const [token, setToken] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);

  useEffect(() => {
    const t =
      window.localStorage.getItem("legacy_nominee_token") ||
      window.localStorage.getItem("aegis_nominee_token") ||
      "";
    setToken(t);
  }, []);

  async function askAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch(`${getApiUrl()}/nominee-ask-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: question.trim() }),
      });
      const data = await response.json();

      if (response.ok) {
        const newAnswer = data.answer || "No response received.";
        setAnswer(newAnswer);
        setHistory((prev) => [{ question: question.trim(), answer: newAnswer }, ...prev].slice(0, 8));
      } else {
        setAnswer(data.message || "The assistant could not process your query.");
      }
    } catch {
      setAnswer("Failed to connect to the assistant service. Please check your backend connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell" style={{ maxWidth: "1000px" }}>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <header className="page-header">
        <div className="header-left">
          <h1>AI Continuity & Claims Assistant</h1>
          <p className="page-description">
            Contextual legal, probate, and claim guidance tailored to your allocated assets.
          </p>
        </div>
      </header>

      {/* ── Scope Grid ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {SCOPE_ITEMS.map((item, i) => (
          <div
            key={i}
            style={{
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid var(--line)",
              background: "#fff",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)" }}>{item.title}</div>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px", lineHeight: "1.4" }}>
              {item.desc}
            </div>
          </div>
        ))}
      </div>

      {/* ── Query Form Panel ────────────────────────────────────── */}
      <div className="panel" style={{ padding: "28px", marginBottom: "24px" }}>
        <form onSubmit={askAssistant}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "var(--ink)", marginBottom: "8px" }}>
            Ask a question regarding your allocated inheritance or claim procedures:
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="e.g. How do I unlock my allocated bank accounts after uploading the death certificate?"
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "1px solid var(--line)",
              padding: "12px 14px",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
              resize: "vertical",
              outline: "none",
              color: "var(--ink)",
              marginBottom: "12px",
            }}
          />

          {/* Quick Prompts */}
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>
              Common Inquiries:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {PROMPT_SUGGESTIONS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuestion(p)}
                  style={{
                    fontSize: "12px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--line)",
                    background: "var(--soft)",
                    color: "var(--body)",
                    cursor: "pointer",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="lv-btn lv-btn-primary"
            style={{ height: "42px", padding: "0 20px" }}
          >
            <Icon d={ICONS.message} size={15} />
            {loading ? "Analyzing Estate Records..." : "Ask Assistant"}
          </button>
        </form>

        {/* Answer Display */}
        {answer && (
          <div
            style={{
              marginTop: "24px",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid var(--line)",
              background: "var(--soft)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "var(--ink)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon d={ICONS.check} size={13} />
              </span>
              <strong style={{ fontSize: "14px", color: "var(--ink)" }}>AI Guidance Response</strong>
            </div>
            <div style={{ fontSize: "14px", lineHeight: "1.65", color: "var(--ink)", whiteSpace: "pre-wrap" }}>
              {answer}
            </div>
          </div>
        )}
      </div>

      {/* ── Conversation History ─────────────────────────────────── */}
      {history.length > 0 && (
        <div className="panel" style={{ padding: "24px" }}>
          <h2 className="panel-title" style={{ fontSize: "16px", marginBottom: "16px" }}>
            Recent Consultation History
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {history.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "#fff",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink)" }}>
                  Q: {item.question}
                </div>
                <div style={{ fontSize: "13px", color: "var(--body)", marginTop: "6px", lineHeight: "1.5" }}>
                  {item.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}