/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // popbill is a Node-only SDK — keep it out of the webpack bundle (required at runtime).
  experimental: {
    serverComponentsExternalPackages: ["popbill"],
  },
};

export default nextConfig;
