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
              "connect-src 'self' https://*.openai.com https://*.pusher.com wss://*.pusher.com https://*.astra.datastax.com https://* wss://*",
              "media-src 'self' blob: mediastream: data:",
              "frame-src 'self' blob: data:"
            ].join('; ')
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization'
          }
        ],
      },
    ]
  },
  reactStrictMode: true,
  webpack: (config) => {
    // This will ignore the canvas module on the server
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };
    return config;
  },
  // Add this to skip generating 404 during build
  output: 'standalone'
}

module.exports = nextConfig
  