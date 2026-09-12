"use client";

import { FormEvent, useState } from "react";
import { getApiUrl } from "@/lib/api";

const nomineeQuestions = [
  "How do I claim insurance?",
  "What documents do I need for bank accounts?",
  "How do I transfer property ownership?",
  "What is the probate process?",
  "How do I verify my nominee status?",
  "What should I do first after verification?",
  "How do I contact the vault owner?",
  "What are the timelines for claims?",
];

export default function NomineeAssistantPage() {
  const [token] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("aegis_nominee_token") || ""
  );
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);

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
        const newAnswer = data.answer || "No answer returned.";
        setAnswer(newAnswer);
        setHistory((prev) => [{ question: question.trim(), answer: newAnswer }, ...prev].slice(0, 10));
      } else {
        setAnswer(data.message || "Assistant failed to respond.");
      }
    } catch {
      setAnswer("Unable to reach the assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="nominee-page">
      <header className="vault-header">
        <div>
          <p className="micro-label">Nominee assistant</p>
          <h1>AI-powered inheritance guidance</h1>
        </div>
      </header>

      <section className="console-card assistant-console">
        <div className="card-head">
          <div><p className="micro-label">Ask about shared records</p><h2>How can I help you?</h2></div>
        </div>
        <div className="prompt-chips" aria-label="Example questions">
          {nomineeQuestions.map((example) => (
            <button key={example} type="button" onClick={() => setQuestion(example)}>
              {example}
            </button>
          ))}
        </div>
        <form onSubmit={askAssistant} className="assistant-form">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about insurance claims, property transfer, legal procedures, or your verification status..."
            className="assistant-input"
          />
          <button className="magnetic-button" type="submit" disabled={loading || !question.trim()}>
            {loading ? "Thinking..." : "Ask assistant"}
          </button>
        </form>
        {answer && (
          <div className="assistant-output">
            <div className="card-head">
              <p className="micro-label">Response</p>
            </div>
            <p className="answer-text">{answer}</p>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="conversation-history console-card">
          <div className="card-head">
            <h2>Recent conversations</h2>
          </div>
          <div className="history-list">
            {history.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-question">
                  <span>Q:</span>
                  <p>{item.question}</p>
                </div>
                <div className="history-answer">
                  <span>A:</span>
                  <p>{item.answer.slice(0, 200)}{item.answer.length > 200 ? "..." : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}