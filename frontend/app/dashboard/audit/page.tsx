"use client";

import { useEffect, useState } from "react";
import { cachedFetch, getApiUrl } from "@/lib/api";

type AuditLog = {
  id: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function AuditPage() {
  const [token] = useState(() => (typeof window === "undefined" ? "" : window.localStorage.getItem("legacy_token") || ""));
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    cachedFetch<AuditLog[]>(`${getApiUrl()}/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).then((data) => {
      if (controller.signal.aborted) return;
      setLogs(data || []);
      setLoading(false);
    });
    return () => controller.abort();
  }, [token]);

  function summarizeMetadata(metadata?: Record<string, unknown>) {
    if (!metadata) return "";
    return Object.entries(metadata)
      .filter(([, v]) => v !== "" && v !== null && v !== undefined)
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(" / ");
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1>Audit logging</h1>
        </div>
      </header>

      <article className="console-card">
        <div className="card-head">
          <div><p className="micro-label">Events</p><h2>Vault activity log</h2></div>
          <span>{logs.length} events</span>
        </div>
        <div className="audit-table">
          <div className="audit-header">
            <span>Action</span>
            <span>Details</span>
            <span>Date</span>
          </div>
          {loading ? (
            [1, 2, 3, 4, 5].map((i) => <div className="skeleton-row audit-row" key={i} />)
          ) : logs.length ? logs.map((log) => (
            <div key={log.id} className="audit-row">
              <b>{log.action}</b>
              <small>{summarizeMetadata(log.metadata)}</small>
              <time>{formatDate(log.createdAt)}</time>
            </div>
          )) : (
            <p className="empty-message">No audit events recorded yet.</p>
          )}
        </div>
      </article>
    </div>
  );
}
