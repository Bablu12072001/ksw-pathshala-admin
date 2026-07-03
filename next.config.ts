import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://g4zmqv1pti.execute-api.ap-south-1.amazonaws.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;
