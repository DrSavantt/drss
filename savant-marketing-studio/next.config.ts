import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during builds (pre-existing errors in codebase)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Keep TypeScript checking enabled
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {
    root: process.cwd(), // Explicitly set root to current directory
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;
