/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for the main site
  output: 'standalone',
  trailingSlash: true,
  
  // Asset prefix for production
  basePath: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Static file serving
  async rewrites() {
    return [
      // Serve static assets from public directory
      {
        source: '/images/:path*',
        destination: '/images/:path*',
      },
      {
        source: '/css/:path*',
        destination: '/css/:path*',
      },
      {
        source: '/js/:path*',
        destination: '/js/:path*',
      },
      // Email dashboard routing
      {
        source: '/mails/:path*',
        destination: '/mails/:path*',
      }
    ];
  },

  // Experimental features
  experimental: {
    scrollRestoration: true,
  },

  // Image optimization
  images: {
    unoptimized: true,
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;