/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@bazisage/bazi-core",
    "@bazisage/shared",
    "@bazisage/ai-client",
    "@bazisage/ui",
  ],
  experimental: {
    // Enable React 19 features
    ppr: false,
  },
};

export default nextConfig;
