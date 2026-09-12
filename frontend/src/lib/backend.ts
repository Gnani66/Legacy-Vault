import api, { getApiUrl } from "./api";

export async function checkBackend() {
  const response = await api.get("/api/health");
  return response.data;
}

// Phase 5 — explicit helpers per spec
export async function uploadAsset(formData: FormData) {
  const res = await fetch(`${getApiUrl()}/api/upload`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function verifyDeathCertificate(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${getApiUrl()}/api/ai/verify-death-certificate`, {
    method: "POST",
    body: form,
  });
  return res.json();
}

export async function verifyGovernmentRegistry(certificate_number: string, deceased_name?: string, date_of_death?: string, authority?: string) {
  const res = await fetch(`${getApiUrl()}/api/registry/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ certificate_number, deceased_name, date_of_death, authority }),
  });
  return res.json();
}

export async function unlockAsset(assetId: number | string) {
  const res = await fetch(`${getApiUrl()}/api/blockchain/unlock/${assetId}`, { method: "POST" });
  return res.json();
}

export async function createClaim(data: { asset_id: string; nominee_wallet: string; death_certificate_cid: string }) {
  const res = await fetch(`${getApiUrl()}/api/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getClaims(nominee_wallet?: string) {
  const url = nominee_wallet ? `${getApiUrl()}/api/claims?nominee_wallet=${nominee_wallet}` : `${getApiUrl()}/api/claims`;
  const res = await fetch(url);
  return res.json();
}
