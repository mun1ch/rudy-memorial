import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Allow up to 50MB for photo uploads
    },
  },
  // Image optimization settings for preserving quality
  images: {
    // Allow all remote patterns for local uploads and Vercel Blob
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '6464',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'lt85jnif42oqcn3o.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
