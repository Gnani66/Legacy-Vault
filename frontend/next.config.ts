import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // removed optimizeCss - it hangs Turbopack with Tailwind v4 @import "tailwindcss"
  // kept only safe experimental flag
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
