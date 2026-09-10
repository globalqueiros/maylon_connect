import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maylon-mobilidade.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "auth.maylon.com.br",
      },
    ],
  },
};

export default nextConfig;