/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
      {
        source: '/agent',
        destination: 'http://localhost:3000/agent',
      },
    ];
  },
};

export default nextConfig;