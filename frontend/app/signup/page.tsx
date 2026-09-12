"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getApiUrl } from "@/lib/api";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${getApiUrl()}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to create account.");
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
    <main className="auth-page signup-page">
      <Link className="wordmark auth-brand" href="/">
        <span>AV</span>
        Legacy Vault
      </Link>
      <section className="auth-layout">
        <div className="auth-art">
          <p className="micro-label">Create vault</p>
          <h1>Start with the documents your family cannot afford to lose.</h1>
          <p>
            Build a private intelligence layer for inheritance continuity,
            emergency access, trusted nominees, and long-term estate visibility.
          </p>
          <div className="auth-checks">
            <span>Structured AI analysis</span>
            <span>Nominee governance</span>
            <span>Estate health scoring</span>
          </div>
        </div>
        <form className="auth-card" onSubmit={submit} autoComplete="off">
          <div>
            <p className="micro-label">Signup</p>
            <h2>Create secure vault</h2>
          </div>
          <label>
            Email address
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="off" />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required autoComplete="off" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="magnetic-button" type="submit">{loading ? "Creating" : "Create account"}</button>
          <p>
            Already have a vault? <Link href="/signin">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
