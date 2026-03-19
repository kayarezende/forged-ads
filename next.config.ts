import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Serve local uploads directory as static files
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
