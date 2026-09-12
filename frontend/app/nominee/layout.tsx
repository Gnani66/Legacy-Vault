"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";

type NomineeProfile = {
  id: string;
  name: string;
  relation: string;
  email: string;
  accessLevel: string;
  isVerified: boolean;
};

export default function NomineeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [nominee, setNominee] = useState<NomineeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { label: "Documents", href: "/nominee/documents" },
    { label: "Guidance", href: "/nominee/guidance" },
    { label: "Assistant", href: "/nominee/assistant" },
  ];

  useEffect(() => {
    const storedToken = window.localStorage.getItem("legacy_nominee_token");
    if (!storedToken) {
      window.location.href = "/nominee-login";
      return;
    }
    
    fetch(`${getApiUrl()}/nominee-vault`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.nominee) {
          setNominee(data.nominee);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  function logout() {
    window.localStorage.removeItem("legacy_nominee_token");
    window.localStorage.removeItem("legacy_nominee_email");
    window.location.href = "/nominee-login";
  }

  return (
    <main className="vault-app nominee-app">
      <aside className="vault-sidebar">
        <Link className="wordmark" href="/">
          <span>AV</span>
          Legacy Vault
        </Link>
        <nav>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="health-widget">
          <small>Verification</small>
          <strong>{loading ? "..." : nominee?.isVerified ? "Verified" : "Pending"}</strong>
          <div>
            <span style={{ width: nominee?.isVerified ? "100%" : "30%" }} />
          </div>
        </div>
        <div className="access-badge">
          <small>Access Level</small>
          <strong>{loading ? "..." : nominee?.accessLevel || "Limited"}</strong>
        </div>
        <button onClick={logout}>Sign out</button>
      </aside>
      <section className="vault-main">
        {children}
      </section>
    </main>
  );
}