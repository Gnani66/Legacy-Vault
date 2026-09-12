import axios from "axios";

let cachedApiUrl: string | null = null;

export function getApiUrl(): string {
  if (cachedApiUrl) return cachedApiUrl;
  if (typeof window === "undefined") {
    // Use env if set, otherwise localhost:5000
    return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  }
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    cachedApiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    return cachedApiUrl;
  }
  const { protocol, hostname } = window.location;
  const backendHost = hostname === "localhost" || hostname === "127.0.0.1" ? "localhost" : hostname;
  cachedApiUrl = `${protocol}//${backendHost}:5000`;
  return cachedApiUrl;
}

// Axios instance per Phase 5.6 — baseURL from env
const api = axios.create({
  baseURL: getApiUrl(),
  headers: { "Content-Type": "application/json" },
});

// Auto-attach JWT if present (owner or nominee)
if (typeof window !== "undefined") {
  api.interceptors.request.use((config) => {
    const token =
      window.localStorage.getItem("legacy_token") ||
      window.localStorage.getItem("legacy_nominee_token");
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

export default api;

// --- Lightweight client-side request cache (stale-while-revalidate) ---
type CacheEntry<T> = { data: T; expiry: number };
const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL = 30_000;
const SCORE_TTL = 60_000;

function ttlFor(url: string): number {
  if (url.includes("continuity-score")) return SCORE_TTL;
  if (url.includes("security-posture")) return SCORE_TTL;
  return DEFAULT_TTL;
}

export function clearApiCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const k of cache.keys()) if (k.includes(pattern)) cache.delete(k);
}

export async function cachedFetch<T>(url: string, init?: RequestInit, ttl?: number): Promise<T | null> {
  const method = (init?.method || "GET").toUpperCase();
  if (method !== "GET") {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  }
  const key = `${url}::${init?.headers ? JSON.stringify(init.headers) : ""}`;
  const now = Date.now();
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiry > now) return hit.data;
  if (inflight.has(key)) return inflight.get(key) as Promise<T | null>;
  const effectiveTtl = ttl ?? ttlFor(url);
  const p = fetch(url, { ...init, signal: init?.signal } as RequestInit)
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as T;
      cache.set(key, { data, expiry: Date.now() + effectiveTtl });
      return data;
    })
    .catch(() => null)
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p as Promise<T | null>;
}
