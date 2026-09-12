"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NomineesIndex() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/nominees"); }, [router]);
  return null;
}
