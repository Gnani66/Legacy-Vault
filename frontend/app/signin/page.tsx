"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getApiUrl } from "@/lib/api";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${getApiUrl()}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to sign in.");
        return;
      }

      window.localStorage.setItem("legacy_token", data.token);
      window.location.href = "/dashboard";
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
        Legacy Vault
      </Link>
      <section className="auth-layout">
        <div className="auth-art">
          <p className="micro-label">Vault access</p>
          <h1>Securely access your family&apos;s critical documents.</h1>
          <p>
            Maintain your private intelligence layer for inheritance continuity,
            emergency access, trusted nominees, and long-term estate visibility.
          </p>
        </div>
        <form className="auth-card" onSubmit={submit} autoComplete="off">
          <div>
            <p className="micro-label">Sign in</p>
            <h2>Access vault</h2>
          </div>
          <label>
            Email address
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="off" />
          </label>
          <label>
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required autoComplete="off" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="magnetic-button" type="submit" disabled={loading}>
            {loading ? "Signing in" : "Sign in"}
          </button>
          <p>
            New to Aegis Vault? <Link href="/signup">Create an account</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
