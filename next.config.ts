import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://cdn.payphonetodoesposible.com https://*.payphonetodoesposible.com https://hcaptcha.com https://*.hcaptcha.com`,
  "style-src 'self' 'unsafe-inline' https://cdn.payphonetodoesposible.com https://hcaptcha.com https://*.hcaptcha.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://hcaptcha.com https://*.hcaptcha.com",
  "font-src 'self' data:",
  "media-src 'self' https://res.cloudinary.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.payphonetodoesposible.com https://hcaptcha.com https://*.hcaptcha.com",
  "frame-src 'self' https://*.payphonetodoesposible.com https://hcaptcha.com https://*.hcaptcha.com https://www.youtube.com https://www.youtube-nocookie.com https://*.elf.site",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // PayPhone valida el dominio que abre la Cajita. Esta política deja
          // viajar el origen sin exponer la ruta ni datos del checkout.
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self)",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/productos/equipamiento/:path*",
        destination: "/productos/camping/:path*",
        permanent: true,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
