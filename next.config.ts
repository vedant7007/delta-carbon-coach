import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Charts are heavy; keep them out of the main bundle.
    optimizePackageImports: ['recharts'],
  },
};

export default nextConfig;
