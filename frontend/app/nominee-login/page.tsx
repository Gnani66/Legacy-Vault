"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getApiUrl } from "@/lib/api";

type Step = "email" | "otp" | "success";

type IncomingNotification = {
  id: string;
  recipientEmail: string;
  nomineeName: string;
  ownerEmail: string;
  type: string;
  title: string;
  message: string;
  code?: string;
  createdAt: string;
};

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
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  check: "M20 6L9 17l-5-5",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
};

function NomineeLoginForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [notification, setNotification] = useState<IncomingNotification | null>(null);

  useEffect(() => {
    const paramEmail = searchParams?.get("email");
    if (paramEmail) {
      setEmail(paramEmail);
      checkNotification(paramEmail);
    } else {
      checkNotification("sarah.nominee@example.com");
    }
  }, [searchParams]);

  async function checkNotification(targetEmail: string) {
    try {
      const res = await fetch(`${getApiUrl()}/nominee/notifications?email=${encodeURIComponent(targetEmail.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.notifications && data.notifications.length > 0) {
          setNotification(data.notifications[0]);
          if (data.notifications[0].code) {
            setDemoOtp(data.notifications[0].code);
          }
        }
      }
    } catch {}
  }

  async function requestMagicLink(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/nominee/request-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Unable to send access link.");
        return;
      }
      if (data.demoOtp) {
        setDemoOtp(data.demoOtp);
      }
      await checkNotification(email.trim());
      setStep("otp");
    } catch {
      setError("Unable to reach the backend. Make sure the server is running on port 5000.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/nominee/verify-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Verification failed.");
        return;
      }
      window.localStorage.setItem("legacy_nominee_token", data.token);
      window.localStorage.setItem("aegis_nominee_token", data.token);
      window.localStorage.setItem("legacy_nominee_email", email.trim());
      setStep("success");
      setTimeout(() => {
        window.location.href = "/nominee-dashboard";
      }, 800);
    } catch {
      setError("Unable to reach the backend server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card" style={{ maxWidth: "460px", width: "100%", margin: "0 auto" }}>
      {/* Simulated Email Notification Dispatch Banner */}
      {notification && (
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            padding: "16px",
            marginBottom: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: "700", fontSize: "12px", color: "var(--ink)", textTransform: "uppercase" }}>
              <Icon d={ICONS.mail} size={14} /> Email Dispatch Preview
            </span>
            <span style={{ fontSize: "11px", color: "var(--muted)", background: "var(--soft)", border: "1px solid var(--line)", padding: "2px 8px", borderRadius: "4px" }}>
              To: {notification.recipientEmail}
            </span>
          </div>
          <div style={{ fontWeight: "600", fontSize: "13px", color: "var(--ink)", marginBottom: "4px" }}>
            {notification.title}
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--body)", lineHeight: "1.45" }}>
            {notification.message}
          </p>
          {notification.code && (
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                Verification OTP: <strong style={{ color: "var(--ink)", fontFamily: "var(--font-mono)" }}>{notification.code}</strong>
              </span>
              <button
                type="button"
                onClick={() => setOtp(notification.code || "")}
                style={{
                  background: "var(--ink)",
                  color: "#fff",
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Click to Fill OTP
              </button>
            </div>
          )}
        </div>
      )}

      {step === "email" && (
        <form onSubmit={requestMagicLink}>
          <div style={{ marginBottom: "20px" }}>
            <p className="micro-label">Beneficiary Access</p>
            <h2 style={{ fontSize: "24px", fontWeight: "700", margin: "4px 0" }}>
              Access your allocated vault
            </h2>
            <p style={{ fontSize: "14px", color: "var(--body)", margin: 0 }}>
              Enter your designated beneficiary email to receive a secure one-time passcode.
            </p>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "var(--ink)" }}>
              Nominee Email Address
            </label>
            <input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                checkNotification(e.target.value);
              }}
              type="email"
              placeholder="e.g. sarah.nominee@example.com"
              required
              style={{
                width: "100%",
                height: "42px",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "0 12px",
                fontSize: "14px",
                background: "#fff",
                color: "var(--ink)",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <button
              type="button"
              onClick={() => {
                setEmail("sarah.nominee@example.com");
                checkNotification("sarah.nominee@example.com");
              }}
              style={{
                fontSize: "12px",
                background: "var(--soft)",
                border: "1px solid var(--line)",
                padding: "6px 12px",
                borderRadius: "6px",
                color: "var(--ink)",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Preset: Sarah Jenkins
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("robert.legal@example.com");
                checkNotification("robert.legal@example.com");
              }}
              style={{
                fontSize: "12px",
                background: "var(--soft)",
                border: "1px solid var(--line)",
                padding: "6px 12px",
                borderRadius: "6px",
                color: "var(--ink)",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Preset: Robert Smith
            </button>
          </div>

          {error && <div className="error-banner" style={{ marginBottom: "16px" }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="lv-btn lv-btn-primary"
            style={{ width: "100%", height: "42px", justifyContent: "center" }}
          >
            <Icon d={ICONS.mail} size={15} />
            {loading ? "Sending Access Code..." : "Send Secure Access Code"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verifyOtp}>
          <div style={{ marginBottom: "20px" }}>
            <p className="micro-label">Security Verification</p>
            <h2 style={{ fontSize: "24px", fontWeight: "700", margin: "4px 0" }}>
              Enter 6-Digit Passcode
            </h2>
            <p style={{ fontSize: "14px", color: "var(--body)", margin: 0 }}>
              Sent to <b>{email}</b>. Use the code dispatched above or demo master OTP: <b>123456</b>.
            </p>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "var(--ink)" }}>
              6-Digit One-Time Passcode
            </label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              autoFocus
              required
              style={{
                width: "100%",
                height: "46px",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "0 12px",
                fontSize: "22px",
                textAlign: "center",
                letterSpacing: "0.25em",
                fontFamily: "var(--font-mono)",
                background: "#fff",
                color: "var(--ink)",
              }}
            />
          </div>

          {demoOtp && (
            <div style={{ marginBottom: "16px", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setOtp(demoOtp)}
                style={{
                  fontSize: "12px",
                  color: "var(--ink)",
                  background: "var(--soft)",
                  border: "1px solid var(--line)",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Auto-fill Code: {demoOtp}
              </button>
            </div>
          )}

          {error && <div className="error-banner" style={{ marginBottom: "16px" }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="lv-btn lv-btn-primary"
            style={{ width: "100%", height: "42px", justifyContent: "center" }}
          >
            <Icon d={ICONS.lock} size={15} />
            {loading ? "Verifying..." : "Verify & Enter Nominee Portal"}
          </button>

          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <button
              type="button"
              onClick={() => setStep("email")}
              style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "13px", cursor: "pointer" }}
            >
              ← Use a different email address
            </button>
          </div>
        </form>
      )}

      {step === "success" && (
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#10b981",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
            }}
          >
            <Icon d={ICONS.check} size={24} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 8px" }}>
            Access Granted
          </h2>
          <p style={{ color: "var(--body)", fontSize: "14px" }}>
            Loading your allocated beneficiary dashboard...
          </p>
        </div>
      )}
    </div>
  );
}

export default function NomineeLoginPage() {
  return (
    <main className="auth-page">
      <Link className="wordmark auth-brand" href="/">
        <span>LV</span>
        Legacy Vault
      </Link>
      <section className="auth-layout">
        <div className="auth-art">
          <p className="micro-label">Beneficiary Continuity</p>
          <h1>Claim and manage designated family inheritance.</h1>
          <p>
            Secure, passwordless verification for trusted nominees. Review allocated assets,
            submit official civil certificates, and unlock digital legacy access.
          </p>
        </div>
        <Suspense fallback={<div className="auth-card"><p>Loading login form...</p></div>}>
          <NomineeLoginForm />
        </Suspense>
      </section>
    </main>
  );
}
