"use client";

import { useEffect } from "react";

export default function ScrollNav() {
  useEffect(() => {
    const nav = document.querySelector(".av-nav, .lv-nav") as HTMLElement | null;
    if (!nav) return;

    const onScroll = () => {
      if (window.scrollY > 20) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a[href^='#']") as HTMLAnchorElement | null;
      if (!target) return;
      const id = target.getAttribute("href")?.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      const navHeight = nav.offsetHeight;
      const offset = el.getBoundingClientRect().top + window.scrollY - navHeight - 8;
      window.scrollTo({ top: offset, behavior: "smooth" });
    };

    document.addEventListener("click", handleAnchorClick, true);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, []);

  return null;
}
