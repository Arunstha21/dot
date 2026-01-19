import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration for Next.js 16+
  turbopack: {
    // Turbopack handles code splitting automatically
    // If needed, custom rules can be added here
  },
  experimental: {
    // Optimize package imports for smaller bundle sizes
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

export default nextConfig;
