"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getApiUrl } from "@/lib/api";

type Step = "email" | "otp" | "success";

export default function NomineeLoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setStep("otp");
    } catch {
      setError("Unable to reach the backend. Make sure the server is running.");
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
      window.localStorage.setItem("legacy_nominee_email", email.trim());
      setStep("success");
      setTimeout(() => { window.location.href = "/nominee-dashboard"; }, 1200);
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="wordmark auth-brand" href="/">
        <span>AV</span>
        Aegis Vault
      </Link>
      <section className="auth-layout">
        <div className="auth-art">
          <p className="micro-label">Nominee access</p>
          <h1>Secure continuity access for trusted contacts.</h1>
          <p>
            No passwords to remember. Nominees receive a secure magic link
            followed by phone verification for frictionless yet military-grade access.
          </p>
          <div className="auth-checks">
            <span>Magic link email</span>
            <span>Phone OTP verification</span>
            <span>Permitted docs only</span>
          </div>
        </div>
        <div className="auth-card">
          {step === "email" && (
            <form onSubmit={requestMagicLink}>
              <div>
                <p className="micro-label">Nominee access</p>
                <h2>Request vault access</h2>
              </div>
              <label>
                Email address
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="your@email.com"
                  required
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button className="magnetic-button" type="submit" disabled={loading}>
                {loading ? "Sending link" : "Send secure access link"}
              </button>
              <p className="auth-note">
                Enter the email address registered by the vault owner.
                You will receive a secure link to proceed.
              </p>
            </form>
          )}
          {step === "otp" && (
            <form onSubmit={verifyOtp}>
              <div>
                <p className="micro-label">Phone verification</p>
                <h2>Enter verification code</h2>
              </div>
              <p className="otp-desc">
                A 6-digit code was sent to your registered phone.
                Enter it below to access the vault.
              </p>
              <label>
                6-digit OTP
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  placeholder="_ _ _ _ _ _"
                  maxLength={6}
                  required
                  autoFocus
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button className="magnetic-button" type="submit" disabled={loading || otp.length < 6}>
                {loading ? "Verifying" : "Verify and access vault"}
              </button>
              <button type="button" className="resend-btn" onClick={() => setStep("email")}>
                Re-send magic link
              </button>
            </form>
          )}
          {step === "success" && (
            <div className="auth-success">
              <div className="success-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="20" fill="#10b981" />
                  <path d="M12 20l6 6 12-12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2>Access granted</h2>
              <p>Redirecting to your vault view...</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
