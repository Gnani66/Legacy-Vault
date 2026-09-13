"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { cachedFetch, clearApiCache, getApiUrl } from "@/lib/api";

type Nominee = {
  id: string;
  name: string;
  relation: string;
  email: string;
  phone?: string;
  accessLevel?: string;
  isVerified?: boolean;
  inviteLink?: string;
};

const accessLabels: Record<string, string> = {
  PRIMARY: "Primary Nominee",
  SECONDARY: "Secondary Nominee",
  LEGAL: "Legal Representative",
};

export default function NomineesPage() {
  const [token] = useState(() => (typeof window === "undefined" ? "" : window.localStorage.getItem("legacy_token") || ""));
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [form, setForm] = useState({ name: "", relation: "", email: "", phone: "", accessLevel: "PRIMARY" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [latestInvite, setLatestInvite] = useState<{ name: string; email: string; link: string } | null>(null);

  useEffect(() => {
    // If no owner token, use demo credentials or redirect
    let currentToken = token;
    if (!currentToken) {
      // Auto sign-in with demo account if testing
      fetch(`${getApiUrl()}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@aegisvault.com", password: "password123" }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.token) {
            window.localStorage.setItem("legacy_token", data.token);
            loadNominees(data.token);
          }
        })
        .catch(() => setLoading(false));
      return;
    }

    loadNominees(currentToken);
  }, [token]);

  function loadNominees(authToken: string) {
    const controller = new AbortController();
    cachedFetch<Nominee[]>(`${getApiUrl()}/nominees`, {
      headers: { Authorization: `Bearer ${authToken}` },
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return;
        setNominees(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function addNominee(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const authToken = window.localStorage.getItem("legacy_token") || token;
    try {
      const res = await fetch(`${getApiUrl()}/nominees`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        clearApiCache("nominees");
        setNominees([...nominees, data]);
        setLatestInvite({
          name: form.name,
          email: form.email,
          link: data.inviteLink || `/nominee-login?email=${encodeURIComponent(form.email)}`,
        });
        setForm({ name: "", relation: "", email: "", phone: "", accessLevel: "PRIMARY" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteNominee(id: string) {
    const authToken = window.localStorage.getItem("legacy_token") || token;
    await fetch(`${getApiUrl()}/nominees/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    clearApiCache("nominees");
    setNominees((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="micro-label">Governance & Succession</p>
          <h1>Nominee Management & Succession Assignment</h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            href="/nominee-login"
            className="lv-btn lv-btn-primary"
            target="_blank"
          >
            Launch Nominee Portal ↗
          </Link>
        </div>
      </header>

      {/* Dispatched Notification Banner */}
      {latestInvite && (
        <div
          style={{
            background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
            border: "1px solid #10b981",
            borderRadius: "14px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", color: "#065f46" }}>
              <span>✓</span>
              <span>Nominee Assigned & Notification Dispatched</span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#047857" }}>
              An invitation email has been dispatched to <b>{latestInvite.email}</b> for <b>{latestInvite.name}</b>.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}${latestInvite.link}`);
                alert("Nominee access link copied to clipboard!");
              }}
              style={{
                fontSize: "12px",
                background: "#fff",
                border: "1px solid #059669",
                color: "#065f46",
                borderRadius: "8px",
                padding: "8px 14px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Copy Access Link
            </button>
            <Link
              href={latestInvite.link}
              target="_blank"
              style={{
                fontSize: "12px",
                background: "#059669",
                color: "#fff",
                borderRadius: "8px",
                padding: "8px 14px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Test Login as {latestInvite.name} ↗
            </Link>
          </div>
        </div>
      )}

      <div className="console-grid">
        {/* Add Nominee Card */}
        <article className="console-card">
          <div className="card-head">
            <div>
              <p className="micro-label">Designate Heir</p>
              <h2>Add trusted nominee</h2>
            </div>
          </div>
          <form className="nominee-control" onSubmit={addNominee}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "4px", display: "block" }}>Full Name</label>
              <input
                placeholder="e.g. Alex Jenkins"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "4px", display: "block" }}>Relationship</label>
              <input
                placeholder="e.g. Daughter / Son / Spouse / Attorney"
                value={form.relation}
                onChange={(e) => setForm({ ...form, relation: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "4px", display: "block" }}>Nominee Email (Notification Destination)</label>
              <input
                placeholder="e.g. alex@example.com"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "4px", display: "block" }}>Phone Number</label>
              <input
                placeholder="e.g. +1 555-019-2834"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", marginBottom: "4px", display: "block" }}>Access Level</label>
              <select
                value={form.accessLevel}
                onChange={(e) => setForm({ ...form, accessLevel: e.target.value })}
              >
                <option value="PRIMARY">PRIMARY (All Allocated Assets & Documents)</option>
                <option value="SECONDARY">SECONDARY (Contingency Escrow)</option>
                <option value="LEGAL">LEGAL (Probate & Legal Executor)</option>
              </select>
            </div>
            <button className="magnetic-button" type="submit" disabled={submitting} style={{ marginTop: "10px" }}>
              {submitting ? "Assigning & Dispatching Email..." : "Add Nominee & Dispatch Invite"}
            </button>
          </form>
        </article>

        {/* Nominee Register List */}
        <article className="console-card">
          <div className="card-head">
            <div>
              <p className="micro-label">Continuity register</p>
              <h2>Trusted nominees ({nominees.length})</h2>
            </div>
          </div>
          <div className="trusted-list">
            {loading ? (
              [1, 2, 3].map((i) => <div className="skeleton-row" key={i} />)
            ) : nominees.length ? (
              nominees.map((nominee) => {
                const nomineeLink = `/nominee-login?email=${encodeURIComponent(nominee.email)}`;
                return (
                  <div
                    key={nominee.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px",
                      borderBottom: "1px solid #f1f5f9",
                      gap: "12px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <b style={{ fontSize: "15px", color: "#1e293b" }}>{nominee.name}</b>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: nominee.isVerified ? "#ecfdf5" : "#fffbeb",
                            color: nominee.isVerified ? "#065f46" : "#b45309",
                            fontWeight: "600",
                          }}
                        >
                          {nominee.isVerified ? "✓ Activated" : "Invite Pending"}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: "#f1f5f9",
                            color: "#475569",
                            fontWeight: "600",
                          }}
                        >
                          {accessLabels[nominee.accessLevel || ""] || nominee.accessLevel}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#64748b" }}>
                        {nominee.relation} · <span>{nominee.email}</span> {nominee.phone ? `· ${nominee.phone}` : ""}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Link
                        href={nomineeLink}
                        target="_blank"
                        className="lv-btn"
                        style={{
                          fontSize: "12px",
                          padding: "6px 12px",
                          background: "#ede9fe",
                          color: "#6d28d9",
                          borderRadius: "6px",
                          border: "1px solid #c4b5fd",
                          fontWeight: "600",
                        }}
                      >
                        Access Portal ↗
                      </Link>
                      <button
                        className="danger-button"
                        onClick={() => void deleteNominee(nominee.id)}
                        style={{ padding: "6px 10px", fontSize: "12px" }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-message">No nominees added yet. Add a trusted contact above.</p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
