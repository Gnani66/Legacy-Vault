"use client";

import { FormEvent, useEffect, useState } from "react";
import { cachedFetch, clearApiCache, getApiUrl } from "@/lib/api";

type Nominee = { id: string; name: string };
type EmergencyConfig = {
  inactivityThreshold: number;
  emergencyNomineeId?: string;
  releaseConditions?: string;
};

export default function EmergencyPage() {
  const [token] = useState(() => (typeof window === "undefined" ? "" : window.localStorage.getItem("legacy_token") || ""));
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [config, setConfig] = useState<EmergencyConfig>({ inactivityThreshold: 90, emergencyNomineeId: "", releaseConditions: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const opts = { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal } as RequestInit;
    Promise.allSettled([
      cachedFetch<Nominee[]>(`${getApiUrl()}/nominees`, opts),
      cachedFetch<EmergencyConfig>(`${getApiUrl()}/emergency-config`, opts),
    ]).then(([nomRes, cfgRes]) => {
      if (controller.signal.aborted) return;
      if (nomRes.status === "fulfilled" && nomRes.value) setNominees(nomRes.value as Nominee[]);
      if (cfgRes.status === "fulfilled" && cfgRes.value) setConfig(cfgRes.value as EmergencyConfig);
    });
    return () => controller.abort();
  }, [token]);

  async function saveConfig(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await fetch(`${getApiUrl()}/emergency-config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      clearApiCache("emergency-config");
      setConfig(await res.json());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="micro-label">Emergency configuration</p>
          <h1>Continuity workflow</h1>
        </div>
      </header>

      <article className="console-card emergency-card">
        <div className="card-head">
          <div><p className="micro-label">Workflow</p><h2>Inactivity thresholds</h2></div>
          {saved && <span className="status-pill success">Saved</span>}
        </div>
        <p className="workflow-desc">
          When the vault owner becomes inactive for the defined threshold period,
          the emergency nominee is notified and granted controlled vault access
          under the specified release conditions.
        </p>
        <form className="nominee-control" onSubmit={saveConfig}>
          <label className="full-width">
            <span>Inactivity threshold (days)</span>
            <input
              type="number"
              min={1}
              value={config.inactivityThreshold}
              onChange={(e) => setConfig({ ...config, inactivityThreshold: Number(e.target.value) })}
            />
          </label>
          <label className="full-width">
            <span>Emergency nominee</span>
            <select
              value={config.emergencyNomineeId || ""}
              onChange={(e) => setConfig({ ...config, emergencyNomineeId: e.target.value })}
            >
              <option value="">Select emergency nominee</option>
              {nominees.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </label>
          <label className="full-width">
            <span>Release conditions</span>
            <input
              value={config.releaseConditions || ""}
              onChange={(e) => setConfig({ ...config, releaseConditions: e.target.value })}
              placeholder="Conditions for vault access release"
            />
          </label>
          <button className="magnetic-button" type="submit">Save configuration</button>
        </form>
      </article>

      <article className="console-card flow-diagram">
        <div className="card-head"><h2>Continuity flow</h2></div>
        <div className="flow-steps">
          {[
            { step: "01", label: "Inactive detection", desc: "Owner stops signing in" },
            { step: "02", label: "Verification begins", desc: "System checks last activity" },
            { step: "03", label: "Nominee notified", desc: "Emergency contact alerted" },
            { step: "04", label: "Vault access", desc: "Controlled document release" },
          ].map(({ step, label, desc }) => (
            <div key={step} className="flow-step">
              <span className="step-num">{step}</span>
              <b>{label}</b>
              <small>{desc}</small>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
