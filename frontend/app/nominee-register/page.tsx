"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getApiUrl } from "@/lib/api";

export default function NomineeRegisterPage() {
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("email") || "";
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${getApiUrl()}/nominee-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to activate nominee account.");
        return;
      }

      setMessage("Nominee account activated. You can now sign in.");
    } catch {
      setError("Unable to reach the backend. Make sure the server is running on port 5000.");
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
          <p className="micro-label">Nominee invitation</p>
          <h1>Activate limited inheritance access.</h1>
          <p>
            Create your nominee password after the vault owner adds your email. Access stays restricted to shared inheritance records and continuity guidance.
          </p>
          <div className="auth-checks">
            <span>Verified invite</span>
            <span>Limited vault</span>
            <span>AI guidance</span>
          </div>
        </div>
        <form className="auth-card" onSubmit={submit}>
          <div>
            <p className="micro-label">Nominee register</p>
            <h2>Set password</h2>
          </div>
          <label>
            Invited email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} required />
          </label>
          {error && <p className="form-error">{error}</p>}
          {message && <p>{message}</p>}
          <button className="magnetic-button" type="submit">{loading ? "Activating" : "Activate account"}</button>
          <p>
            Already activated? <Link href="/nominee-login">Sign in as nominee</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
