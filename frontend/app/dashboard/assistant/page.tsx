"use client";

import { FormEvent, useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";

const assistantExamples = [
  "How do I claim this insurance?",
  "What does this legal document mean?",
  "What should I do next?",
];

const continuityHelp = [
  ["Insurance claims", "Policy evidence, nominee checks, claim documents"],
  ["Legal understanding", "Plain-language summaries and risk flags"],
  ["Continuity steps", "Next actions for inheritance readiness"],
  ["Vault navigation", "Find the right document and owner context"],
];

export default function AssistantPage() {
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(window.localStorage.getItem("legacy_token") || "");
  }, []);
  const [question, setQuestion] = useState("How do I claim this insurance?");
  const [answer, setAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  async function askAi(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!question.trim()) return;
    setIsAsking(true);
    setAnswer("");
    try {
      const res = await fetch(`${getApiUrl()}/ask-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(data.answer || "No answer returned.");
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div className="page-shell assistant-wrap">
      <header className="page-header">
        <div>
          <h1>AI continuity assistant</h1>
        </div>
      </header>

      <div className="assistant-scope-grid">
        {continuityHelp.map(([label, note]) => (
          <div key={label}>
            <b>{label}</b>
            <span>{note}</span>
          </div>
        ))}
      </div>

      <div className="prompt-chips" aria-label="Example questions">
        {assistantExamples.map((example) => (
          <button key={example} type="button" onClick={() => setQuestion(example)}>
            {example}
          </button>
        ))}
      </div>

      <form className="assistant-input-row" onSubmit={askAi}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about insurance claims, legal documents, inheritance steps, or vault records"
        />
        <button className="magnetic-button" type="submit" disabled={isAsking}>
          {isAsking ? "Thinking" : "Ask assistant"}
        </button>
      </form>

      {answer && (
        <div className="assistant-output">
          <div className="card-head">
            <p className="micro-label">Response</p>
          </div>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
