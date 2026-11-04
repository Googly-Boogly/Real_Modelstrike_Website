import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const extraOrigins = (name: string) => (process.env[name] ?? "").split(/\s+/).filter(Boolean).join(" ");

/** The Cal.com embed on /contact (see CalEmbed) loads its script and iframe from these. */
const cal = process.env.NEXT_PUBLIC_CAL_LINK?.trim()
  ? { script: "https://app.cal.com", connect: "https://app.cal.com", frame: "https://app.cal.com https://cal.com" }
  : { script: "", connect: "", frame: "" };

// Nonce-less CSP so every marketing page can stay statically rendered.
// 'unsafe-inline' for scripts is needed for Next's inline bootstrap without nonces.
// The only third-party origin is Cal.com, and only when NEXT_PUBLIC_CAL_LINK is set;
// add others via CSP_SCRIPT_SRC / CSP_CONNECT_SRC / CSP_FRAME_SRC (space-separated).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${cal.script} ${extraOrigins("CSP_SCRIPT_SRC")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""} ${cal.connect} ${extraOrigins("CSP_CONNECT_SRC")}`,
  `frame-src ${[cal.frame, extraOrigins("CSP_FRAME_SRC")].filter(Boolean).join(" ") || "'none'"}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]
  .map((directive) => directive.replace(/\s+/g, " ").trim())
  .join("; ");

// The private onboarding flow gets a stricter policy: same-origin only, with no Cal.com or
// extra origins, so no third-party script or frame can run alongside customer answers.
const onboardingCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

// Invitation tokens may arrive in the URL: never send it on as a Referer, never cache, never index.
const privateHeaders = [
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    // Later entries override earlier ones for the same header key.
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/onboarding", headers: [...privateHeaders, { key: "Content-Security-Policy", value: onboardingCsp }] },
      { source: "/api/customer-onboarding/:path*", headers: privateHeaders },
    ];
  },
  async redirects() {
    // Legacy URL from the previous security-testing site, so old links don't 404.
    return [{ source: "/security", destination: "/about", permanent: true }];
  },
};

export default nextConfig;
