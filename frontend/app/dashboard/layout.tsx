"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cachedFetch, getApiUrl } from "@/lib/api";

type ContinuityScore = {
  continuityScore: number;
  factors?: Record<string, boolean>;
};

const SCORE_CACHE_KEY = "legacy_score_cache";
const SCORE_CACHE_TTL = 60_000;

/* ── Minimal line icons (16px, 1.5 stroke) ─────────────────────── */

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
  overview:
    "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  vault:
    "M21 8v13H3V8M1 3h22v5H1zM10 12h4",
  users:
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  message:
    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  plug: "M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  menu: "M3 12h18M3 6h18M3 18h18",
  chevron: "M6 9l6 6 6-6",
};

/* ── Navigation model ──────────────────────────────────────────── */

type NavItem = { label: string; href: string; icon: string };

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Vault",
    items: [
      { label: "Overview", href: "/dashboard", icon: ICONS.overview },
      { label: "My Vault", href: "/dashboard/vault", icon: ICONS.vault },
      { label: "Nominees", href: "/dashboard/nominees", icon: ICONS.users },
      { label: "Access Rules", href: "/dashboard/emergency", icon: ICONS.shield },
    ],
  },
  {
    title: "Security",
    items: [
      { label: "Audit Trail", href: "/dashboard/audit", icon: ICONS.list },
      { label: "Security", href: "/dashboard/security", icon: ICONS.lock },
      { label: "Integration", href: "/integration", icon: ICONS.plug },
    ],
  },
  {
    title: "Assist",
    items: [
      { label: "Assistant", href: "/dashboard/assistant", icon: ICONS.message },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function sectionLabel(pathname: string): string {
  const match = ALL_ITEMS.find(
    (i) => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href))
  );
  return match ? match.label : "Dashboard";
}

const FACTOR_LABELS: [string, string][] = [
  ["nomineeExists", "Nominee"],
  ["willUploaded", "Will"],
  ["insuranceExists", "Insurance"],
  ["emergencyContactExists", "Emergency contact"],
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [score, setScore] = useState<ContinuityScore>({ continuityScore: 0 });
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  /* Auth guard + score fetch (unchanged behaviour) */
  useEffect(() => {
    setMounted(true);
    const token = window.localStorage.getItem("legacy_token");
    if (!token) {
      window.location.href = "/signin";
      return;
    }
    try {
      const me = window.localStorage.getItem("legacy_email") || "";
      if (me) setEmail(me);
    } catch {}

    // Paint instantly from session cache, then revalidate
    try {
      const raw = sessionStorage.getItem(SCORE_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { data: ContinuityScore; t: number };
        if (Date.now() - parsed.t < SCORE_CACHE_TTL) setScore(parsed.data);
      }
    } catch {}

    const controller = new AbortController();
    cachedFetch<ContinuityScore>(`${getApiUrl()}/continuity-score`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).then((data) => {
      if (data) {
        setScore(data);
        try {
          sessionStorage.setItem(SCORE_CACHE_KEY, JSON.stringify({ data, t: Date.now() }));
        } catch {}
      }
    });
    return () => controller.abort();
  }, []);

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
    try {
      sessionStorage.removeItem(SCORE_CACHE_KEY);
    } catch {}
    window.localStorage.removeItem("legacy_token");
    window.location.href = "/";
  }

  function onSearch(value: string) {
    setQuery(value);
    window.dispatchEvent(new CustomEvent("lv:search", { detail: value }));
  }

  const initials = (email || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="dashboard-shell">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      {navOpen && <div className="dash-scrim" onClick={() => setNavOpen(false)} />}
      <aside className={`dash-sidebar${navOpen ? " open" : ""}`}>
        <Link className="dash-brand" href="/">
          <span>LV</span>
          <span className="dash-brand-name">Legacy Vault</span>
        </Link>

        <nav className="dash-nav" aria-label="Primary">
          {NAV_GROUPS.map((group) => (
            <div className="nav-group" key={group.title}>
              <p className="nav-group-label">{group.title}</p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={item.href === "/dashboard" ? true : false}
                  className={pathname === item.href ? "nav-item active" : "nav-item"}
                >
                  <span className="nav-icon">
                    <Icon d={item.icon} />
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="dash-sidebar-spacer">
          <div className="health-widget" aria-live="polite">
            <div className="health-widget-head">
              <small>Continuity Score</small>
              <strong>
                {mounted ? score.continuityScore : "–"}
                <em>/100</em>
              </strong>
            </div>
            <div className="health-bar">
              <span style={{ width: `${mounted ? score.continuityScore : 0}%` }} />
            </div>
            <ul className="health-factors">
              {FACTOR_LABELS.map(([key, label]) => (
                <li key={key}>
                  <i className={`factor-dot${mounted && score.factors?.[key] ? " on" : ""}`} />
                  {label}
                </li>
              ))}
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
              <Link href="/dashboard">Vault</Link>
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
                placeholder="Search your vault…"
                aria-label="Search"
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            <Link href="/dashboard/audit" className="icon-btn" title="Recent activity">
              <Icon d={ICONS.bell} />
              <i className="indicator" />
            </Link>

            <div className="profile-menu" ref={profileRef}>
              <button
                className="profile-trigger"
                onClick={() => setProfileOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <span className="avatar">{initials}</span>
                <span className="profile-email">{email || "Account"}</span>
                <span className="profile-caret">
                  <Icon d={ICONS.chevron} size={13} />
                </span>
              </button>
              {profileOpen && (
                <div className="profile-dropdown" role="menu">
                  <p className="profile-dropdown-label">{email || "Signed in"}</p>
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
