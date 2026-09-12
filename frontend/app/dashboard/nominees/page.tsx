"use client";

import { FormEvent, useEffect, useState } from "react";
import { cachedFetch, clearApiCache, getApiUrl } from "@/lib/api";

type Nominee = {
  id: string;
  name: string;
  relation: string;
  email: string;
  phone?: string;
  accessLevel?: string;
  isVerified?: boolean;
};

const accessLabels: Record<string, string> = {
  PRIMARY: "Primary Nominee",
  SECONDARY: "Secondary Nominee",
  LEGAL: "Legal Representative",
};

export default function NomineesPage() {
  const [token, setToken] = useState(() => (typeof window === "undefined" ? "" : window.localStorage.getItem("legacy_token") || ""));
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [form, setForm] = useState({ name: "", relation: "", email: "", phone: "", accessLevel: "PRIMARY" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    cachedFetch<Nominee[]>(`${getApiUrl()}/nominees`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).then((data) => {
      if (controller.signal.aborted) return;
      setNominees(data || []);
      setLoading(false);
    });
    return () => controller.abort();
  }, [token]);

  async function addNominee(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await fetch(`${getApiUrl()}/nominees`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      clearApiCache("nominees");
      setNominees([...nominees, await res.json()]);
      setForm({ name: "", relation: "", email: "", phone: "", accessLevel: "PRIMARY" });
    }
  }

  async function deleteNominee(id: string) {
    await fetch(`${getApiUrl()}/nominees/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    clearApiCache("nominees");
    setNominees((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="micro-label">Nominee system</p>
          <h1>Trusted contacts</h1>
        </div>
      </header>

      <div className="console-grid">
        <article className="console-card">
          <div className="card-head">
            <div><p className="micro-label">Add</p><h2>New nominee</h2></div>
          </div>
          <form className="nominee-control" onSubmit={addNominee}>
            <input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              placeholder="Relation"
              value={form.relation}
              onChange={(e) => setForm({ ...form, relation: e.target.value })}
              required
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <select
              value={form.accessLevel}
              onChange={(e) => setForm({ ...form, accessLevel: e.target.value })}
            >
              <option>PRIMARY</option>
              <option>SECONDARY</option>
              <option>LEGAL</option>
            </select>
            <button className="magnetic-button" type="submit">Add nominee</button>
          </form>
        </article>

        <article className="console-card">
          <div className="card-head">
            <div><p className="micro-label">Continuity access</p><h2>Trusted register</h2></div>
          </div>
          <div className="trusted-list">
            {loading ? (
              [1, 2].map((i) => <div className="skeleton-row" key={i} />)
            ) : nominees.length ? nominees.map((nominee) => (
              <div key={nominee.id}>
                <span>
                  <b>{nominee.name}</b>
                  <small>
                    {nominee.relation} / {accessLabels[nominee.accessLevel || ""] || "Secondary Nominee"} / {nominee.email}
                  </small>
                  <small>{nominee.isVerified ? "Activated" : "Pending invite"}</small>
                </span>
                <button className="danger-button" onClick={() => void deleteNominee(nominee.id)}>Remove</button>
              </div>
            )) : (
              <p className="empty-message">No nominees added yet.</p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
