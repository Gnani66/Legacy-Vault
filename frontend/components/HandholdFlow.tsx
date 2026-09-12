"use client";

import { useEffect, useRef } from "react";

export default function HandholdFlow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf = 0;
    let w = 3024;
    let h = 1592;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8);

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      w = rect.width * dpr;
      h = rect.height * dpr;
      canvas.width = w;
      canvas.height = h;
    }

    // blobs — warm cream palette matching Handhold's flow
    type Blob = { x: number; y: number; vx: number; vy: number; r: number; color: string };
    const blobs: Blob[] = [
      { x: 0.2, y: 0.35, vx: 0.00018, vy: 0.00012, r: 0.32, color: "#ede9ff" }, // lavender
      { x: 0.78, y: 0.42, vx: -0.00014, vy: 0.00016, r: 0.28, color: "#fde68a" }, // amber
      { x: 0.52, y: 0.18, vx: 0.0001, vy: -0.00014, r: 0.22, color: "#e0f2fe" }, // sky
      { x: 0.68, y: 0.72, vx: -0.00012, vy: -0.00009, r: 0.26, color: "#fce7f3" }, // pink
      { x: 0.32, y: 0.78, vx: 0.00015, vy: 0.00011, r: 0.2, color: "#dcfce7" }, // mint
    ];

    let t = 0;
    const frame = () => {
      t += 0.006;
      // Handhold canvas bg is #FFFCF8 warm
      ctx.fillStyle = "#FFFCF8";
      ctx.fillRect(0, 0, w, h);

      // subtle grain veil
      for (const b of blobs) {
        b.x += b.vx + Math.sin(t * 0.7 + b.r) * 0.00004;
        b.y += b.vy + Math.cos(t * 0.5 + b.x * 10) * 0.00004;
        // soft bounce
        if (b.x < 0.08 || b.x > 0.92) b.vx *= -1;
        if (b.y < 0.08 || b.y > 0.92) b.vy *= -1;
        b.x = Math.max(0.08, Math.min(0.92, b.x));
        b.y = Math.max(0.08, Math.min(0.92, b.y));

        const cx = b.x * w;
        const cy = b.y * h;
        const rad = b.r * Math.min(w, h) * 0.95;

        // wobble radius
        const wr = rad * (1 + Math.sin(t * 0.9 + b.x * 5) * 0.06);

        const g = ctx.createRadialGradient(cx, cy, wr * 0.08, cx, cy, wr);
        g.addColorStop(0, b.color + "B8"); // ~72% alpha
        g.addColorStop(0.35, b.color + "66");
        g.addColorStop(0.68, b.color + "22");
        g.addColorStop(1, b.color + "00");

        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, wr, 0, Math.PI * 2);
        ctx.fill();

        // inner highlight — glassy Handhold orb feel
        const hg = ctx.createRadialGradient(cx - wr * 0.18, cy - wr * 0.18, 0, cx, cy, wr * 0.45);
        hg.addColorStop(0, "#ffffffD9");
        hg.addColorStop(0.5, "#ffffff33");
        hg.addColorStop(1, "#ffffff00");
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(cx, cy, wr * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      // very subtle connecting veil like Handhold's flow
      ctx.globalCompositeOperation = "soft-light";
      ctx.fillStyle = "rgba(255,252,248,0.22)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(frame);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    frame();

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) {
      cancelAnimationFrame(raf);
    }
    const onChange = () => {
      if (mql.matches) cancelAnimationFrame(raf);
      else frame();
    };
    mql.addEventListener?.("change", onChange);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mql.removeEventListener?.("change", onChange);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute top-1/2 left-1/2 aspect-[3024/1592] w-full min-w-[1440px] -translate-x-1/2 -translate-y-1/2"
      aria-hidden="true"
      style={{ display: "block" }}
    />
  );
}
