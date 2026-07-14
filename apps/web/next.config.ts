import type { NextConfig } from "next";
import { config } from "dotenv";

config({
  path: [".env.local", ".env", "../../.env.local", "../../.env"],
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pngimg.com",
        pathname: "/uploads/iphone16/**",
      },
      {
        protocol: "https",
        hostname: "lmt-web.mstatic.lv",
        pathname: "/eshop/**",
      },
      {
        protocol: "https",
        hostname: "mistore.se",
        pathname: "/cdn/shop/files/**",
      },
    ],
  },
  transpilePackages: ["@spechub/api-client"],
};

export default nextConfig;
