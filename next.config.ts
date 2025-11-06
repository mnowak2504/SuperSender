import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure bcrypt is server-only (works with both Turbopack and webpack)
  serverExternalPackages: ['@node-rs/bcrypt'],
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  turbopack: {},
};

export default nextConfig;
