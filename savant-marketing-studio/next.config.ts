import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(), // Explicitly set root to current directory
  },
  /* config options here */
};

export default nextConfig;
