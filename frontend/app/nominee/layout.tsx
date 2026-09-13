"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getApiUrl } from "@/lib/api";

type NomineeProfile = {
  id: string;
  name: string;
  relation: string;
  email: string;
  accessLevel: string;
  isVerified: boolean;
};

/* ── Minimal SVG line icons (16px, 1.5 stroke) matching Owner Dashboard ── */
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
  overview: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  vault: "M21 8v13H3V8M1 3h22v5H1zM10 12h4",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  menu: "M3 12h18M3 6h18M3 18h18",
  chevron: "M6 9l6 6 6-6",
  check: "M20 6L9 17l-5-5",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
};

/* ── Navigation groups matching Owner Dashboard style ── */
type NavItem = { label: string; href: string; icon: string };

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Continuity",
    items: [
      { label: "Overview", href: "/nominee-dashboard", icon: ICONS.overview },
      { label: "Allocated Assets", href: "/nominee/assets", icon: ICONS.vault },
      { label: "Death Certificate & Claims", href: "/nominee/claims", icon: ICONS.shield },
    ],
  },
  {
    title: "Vault Records",
    items: [
      { label: "Shared Documents", href: "/nominee/documents", icon: ICONS.file },
      { label: "Claims Guidance", href: "/nominee/guidance", icon: ICONS.list },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "AI Assistant", href: "/nominee/assistant", icon: ICONS.message },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function sectionLabel(pathname: string): string {
  const match = ALL_ITEMS.find(
    (i) => pathname === i.href || (i.href !== "/nominee-dashboard" && pathname.startsWith(i.href))
  );
  return match ? match.label : "Nominee Portal";
}

export default function NomineeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [nominee, setNominee] = useState<NomineeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [inheritanceStatus, setInheritanceStatus] = useState("Pending Action");
  const [navOpen, setNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let storedToken =
      typeof window !== "undefined"
        ? window.localStorage.getItem("legacy_nominee_token") ||
          window.localStorage.getItem("aegis_nominee_token")
        : null;

    if (!storedToken) {
      // Auto-authenticate as demo nominee for instant demonstration
      fetch(`${getApiUrl()}/nominee/verify-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "sarah.nominee@example.com", otp: "123456" }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.token) {
            window.localStorage.setItem("legacy_nominee_token", data.token);
            window.localStorage.setItem("aegis_nominee_token", data.token);
            window.localStorage.setItem("legacy_nominee_email", "sarah.nominee@example.com");
            fetchVault(data.token);
          } else {
            window.location.href = "/nominee-login";
          }
        })
        .catch(() => setLoading(false));
      return;
    }

    fetchVault(storedToken);
  }, []);

  function fetchVault(token: string) {
    fetch(`${getApiUrl()}/nominee-vault`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.nominee) setNominee(data.nominee);
        if (data?.inheritanceStatus) setInheritanceStatus(data.inheritanceStatus);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  /* Close profile menu on outside click */
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  /* Close drawer on navigation */
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  function logout() {
    window.localStorage.removeItem("legacy_nominee_token");
    window.localStorage.removeItem("aegis_nominee_token");
    window.localStorage.removeItem("legacy_nominee_email");
    window.location.href = "/nominee-login";
  }

  function onSearch(value: string) {
    setQuery(value);
    window.dispatchEvent(new CustomEvent("lv:nominee_search", { detail: value }));
  }

  const isVerified =
    inheritanceStatus.toLowerCase().includes("verified") ||
    inheritanceStatus.toLowerCase().includes("unlocked");

  const initials = (nominee?.name || nominee?.email || "S").trim().charAt(0).toUpperCase();

  return (
    <div className="dashboard-shell">
      {/* ── Mobile Scrim ─────────────────────────────────────────── */}
      {navOpen && <div className="dash-scrim" onClick={() => setNavOpen(false)} />}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={`dash-sidebar${navOpen ? " open" : ""}`}>
        <Link className="dash-brand" href="/nominee-dashboard">
          <span>NP</span>
          <span className="dash-brand-name">Nominee Portal</span>
        </Link>

        {/* Nominee Identity Badge */}
        <div
          style={{
            marginTop: "16px",
            marginBottom: "8px",
            padding: "12px 14px",
            background: "var(--soft)",
            border: "1px solid var(--line)",
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Beneficiary
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "var(--ink)",
                color: "#fff",
                textTransform: "uppercase",
              }}
            >
              {nominee?.accessLevel || "PRIMARY"}
            </span>
          </div>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--ink)" }}>
            {loading ? "Loading..." : nominee?.name || "Sarah Jenkins"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--body)", marginTop: "2px" }}>
            {nominee?.relation || "Designated Nominee"}
          </div>
        </div>

        {/* Navigation items */}
        <nav className="dash-nav" aria-label="Primary" style={{ marginTop: "16px" }}>
          {NAV_GROUPS.map((group) => (
            <div className="nav-group" key={group.title}>
              <p className="nav-group-label">{group.title}</p>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={isActive ? "nav-item active" : "nav-item"}
                  >
                    <span className="nav-icon">
                      <Icon d={item.icon} />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer Widget */}
        <div className="dash-sidebar-spacer">
          <div className="health-widget" aria-live="polite">
            <div className="health-widget-head">
              <small>Verification Protocol</small>
              <strong style={{ fontSize: "18px", marginTop: "4px" }}>
                {isVerified ? "Verified" : "Action Required"}
              </strong>
            </div>
            <div className="health-bar" style={{ marginTop: "10px" }}>
              <span style={{ width: isVerified ? "100%" : "35%", background: "var(--ink)" }} />
            </div>
            <ul className="health-factors" style={{ marginTop: "12px" }}>
              <li>
                <i className="factor-dot on" />
                OTP Authenticated
              </li>
              <li>
                <i className={`factor-dot${isVerified ? " on" : ""}`} />
                Death Certificate
              </li>
            </ul>
          </div>

          <button className="dash-logout" onClick={logout}>
            <Icon d={ICONS.logout} size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────────── */}
      <div className="dash-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              className="icon-btn menu-btn"
              aria-label="Toggle navigation"
              onClick={() => setNavOpen((v) => !v)}
            >
              <Icon d={ICONS.menu} />
            </button>
            <nav className="crumb" aria-label="Breadcrumb">
              <Link href="/nominee-dashboard">Nominee Portal</Link>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">{sectionLabel(pathname)}</span>
            </nav>
          </div>

          <div className="topbar-actions">
            <label className="header-search">
              <span className="search-icon">
                <Icon d={ICONS.search} size={14} />
              </span>
              <input
                value={query}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search allocated assets, records…"
                aria-label="Search"
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            <Link href="/nominee/claims" className="icon-btn" title="Claims Verification Status">
              <Icon d={ICONS.bell} />
              {!isVerified && <i className="indicator" />}
            </Link>

            <div className="profile-menu" ref={profileRef}>
              <button
                className="profile-trigger"
                onClick={() => setProfileOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <span className="avatar">{initials}</span>
                <span className="profile-email">{nominee?.name || nominee?.email || "Nominee Account"}</span>
                <span className="profile-caret">
                  <Icon d={ICONS.chevron} size={13} />
                </span>
              </button>
              {profileOpen && (
                <div className="profile-dropdown" role="menu">
                  <p className="profile-dropdown-label">{nominee?.email || "sarah.nominee@example.com"}</p>
                  <Link
                    href="/nominee/claims"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <Icon d={ICONS.shield} size={14} />
                    Submit death certificate
                  </Link>
                  <Link
                    href="/nominee/assets"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <Icon d={ICONS.vault} size={14} />
                    View allocated assets
                  </Link>
                  <button onClick={logout} role="menuitem">
                    <Icon d={ICONS.logout} size={14} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="dash-body">{children}</main>
      </div>
    </div>
  );
}