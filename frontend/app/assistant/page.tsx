"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AssistantIndex() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/assistant"); }, [router]);
  return null;
}
