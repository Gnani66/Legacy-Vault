"use client";

import { useEffect, useState } from "react";
import { cachedFetch, getApiUrl } from "@/lib/api";

type SecurityControl = {
  label: string;
  status: string;
  detail: string;
};

const defaultControls = [
  { label: "Encrypted vault storage", status: "Enabled", detail: "Vault storage controls are ready." },
  { label: "Local AI inference", status: "Enabled", detail: "AI processing stays on the local inference endpoint." },
  { label: "Confidential processing", status: "Enabled", detail: "Sensitive continuity flows are scoped and audited." },
  { label: "TEE-ready architecture", status: "Ready", detail: "API boundaries support future trusted execution deployment." },
  { label: "Multi-factor authentication", status: "Enabled", detail: "2FA protects owner and nominee access." },
  { label: "Audit trail integrity", status: "Enabled", detail: "All vault actions are cryptographically logged." },
  { label: "Magic link authentication", status: "Enabled", detail: "Passwordless nominee access via secure email links." },
  { label: "Phone OTP verification", status: "Enabled", detail: "Possession-based identity verification for nominees." },
];

export default function SecurityPage() {
  const [token] = useState(() => (typeof window === "undefined" ? "" : window.localStorage.getItem("legacy_token") || ""));
  const [controls, setControls] = useState<SecurityControl[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    cachedFetch<{ controls?: SecurityControl[] }>(`${getApiUrl()}/security-posture`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return;
        setControls(data?.controls || defaultControls);
        setLoading(false);
      })
      .catch(() => {
        setControls(defaultControls);
        setLoading(false);
      });
    return () => controller.abort();
  }, [token]);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <h1>Security and encryption</h1>
        </div>
      </header>

      <article className="console-card">
        <div className="card-head">
          <div><p className="micro-label">Architecture</p><h2>Trust posture</h2></div>
        </div>
        <div className="security-grid">
          {loading ? (
            [1, 2, 3, 4].map((i) => <div className="skeleton-card security-card" key={i} />)
          ) : controls.map((control) => (
            <div key={control.label} className="sec-item">
              <span className={`status-badge ${control.status.toLowerCase()}`}>{control.status}</span>
              <b>{control.label}</b>
              <p>{control.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="console-card security-summary">
        <div className="card-head"><h2>Security summary</h2></div>
        <div className="sec-stats">
          <div><strong>{controls.filter((c) => c.status === "Enabled").length}</strong><span>Controls enabled</span></div>
          <div><strong>{controls.filter((c) => c.status === "Ready").length}</strong><span>Ready for upgrade</span></div>
          <div><strong>256-bit</strong><span>Encryption standard</span></div>
          <div><strong>Zero</strong><span>Passwords for nominees</span></div>
        </div>
      </article>
    </div>
  );
}
