import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Allow up to 50MB for photo uploads
    },
  },
  // Image optimization settings for preserving quality
  images: {
    // Allow all remote patterns for local uploads
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '6464',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
