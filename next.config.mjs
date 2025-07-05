/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable source maps for better debugging
  productionBrowserSourceMaps: true,
  // Disable experimental features that might cause issues
  experimental: {
    typedRoutes: false,
    // Use stable features only
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Increase webpack cache age
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  webpack: (config, { dev, isServer }) => {
    // Handle browser-specific modules for serverless compatibility
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false
    
    // Fix for Windows file watching
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      }
    }
    
    // Disable webpack cache in development to prevent stale builds
    if (dev) {
      config.cache = false
    }
    
    return config
  },
}

export default nextConfig
