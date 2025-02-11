// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't run ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't run type checking during production builds
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.cdnfonts.com",
              "font-src 'self' https://fonts.gstatic.com https://fonts.cdnfonts.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://* wss://* api.openai.com",
              "media-src 'self' blob: mediastream: data:",
              "frame-src 'self' blob: data:"
            ].join('; ')
          }
        ],
      },
    ]
  },
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    // Optimize webpack configuration
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        name: isServer ? 'server-development' : 'client-development',
        version: `${isServer ? 'server' : 'client'}-development`,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      };
    }
    // This will ignore the canvas module on the server
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };
    return config;
  },
  // Configure external packages for serverless environment
  serverExternalPackages: ['sharp', 'canvas'],
  // Add this to skip generating 404 during build
  output: 'standalone',
  // Add other Next.js config options here
  poweredByHeader: false,
  swcMinify: true,
}

module.exports = nextConfig
  