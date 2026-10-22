import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  env: { NEXT_PUBLIC_PWA_VERSION: process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? new Date().toISOString() },
  turbopack: { root: process.cwd() },

  // Image Optimization ကို ပိတ်ရန် (Vercel Usage ထပ်မတက်စေရန်)
  images: {
    unoptimized: true,
  },

  
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
