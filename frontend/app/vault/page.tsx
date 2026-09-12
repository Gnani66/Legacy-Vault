"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VaultIndex() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/vault"); }, [router]);
  return null;
}
