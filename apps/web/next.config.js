/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@bazisage/bazi-core",
    "@bazisage/shared",
    "@bazisage/ai-client",
    "@bazisage/ui",
  ],
  // Tell webpack to resolve .js imports as .ts when inside transpiled packages.
  // This is needed because the bazi-core source uses ESM .js extensions
  // (required for Node ESM compatibility) but Next.js bundles the raw TS source.
  webpack(config) {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
