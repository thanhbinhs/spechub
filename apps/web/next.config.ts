import type { NextConfig } from "next";
import { config } from "dotenv";

config({
  path: [".env.local", ".env", "../../.env.local", "../../.env"],
});

function localStorageBaseUrl() {
  const hasS3Connection = Boolean(
    process.env.STORAGE_S3_ENDPOINT?.trim() ||
      process.env.STORAGE_S3_ACCESS_KEY_ID?.trim() ||
      process.env.STORAGE_S3_SECRET_ACCESS_KEY?.trim(),
  );
  const explicitlyLocal =
    process.env.STORAGE_PROVIDER?.trim().toLowerCase() === "local";
  if (
    hasS3Connection ||
    (process.env.NODE_ENV === "production" && !explicitlyLocal)
  ) {
    return "";
  }
  const apiUrl =
    process.env.NEXT_PUBLIC_SPECHUB_API_URL?.trim() ||
    "http://localhost:4000/api/v1";
  try {
    return `${new URL(apiUrl).origin}/media`;
  } catch {
    return "";
  }
}

const storageCdnBaseUrl =
  process.env.NEXT_PUBLIC_STORAGE_CDN_BASE_URL?.trim() ||
  process.env.STORAGE_CDN_BASE_URL?.trim() ||
  process.env.STORAGE_LOCAL_PUBLIC_URL?.trim() ||
  localStorageBaseUrl();

function storageRemotePattern() {
  if (!storageCdnBaseUrl) return [];
  try {
    const url = new URL(storageCdnBaseUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return [];
    const pathname = url.pathname.replace(/\/+$/, "");
    return [
      {
        protocol: url.protocol.slice(0, -1) as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: `${pathname || ""}/**`,
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR?.trim() || ".next",
  transpilePackages: ["@spechub/api-client", "@spechub/scoring-core"],
  env: {
    NEXT_PUBLIC_STORAGE_CDN_BASE_URL: storageCdnBaseUrl,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdsassets.apple.com",
        pathname: "/live/**",
      },
      {
        protocol: "https",
        hostname: "images.openai.com",
        pathname: "/**",
      },
      ...storageRemotePattern(),
    ],
  },
};

export default nextConfig;
