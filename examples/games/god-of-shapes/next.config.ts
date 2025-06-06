/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No need to expose environment variables to the client
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
