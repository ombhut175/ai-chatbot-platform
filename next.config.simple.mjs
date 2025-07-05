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
  webpack: (config, { dev, isServer }) => {
    // Handle browser-specific modules
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false
    
    // Critical: Fix for Windows file watching issues
    if (dev) {
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuild after change detection
        ignored: ['**/node_modules/**', '**/.next/**'],
      }
      
      // Disable persistent caching in development
      config.cache = false
    }
    
    return config
  },
}

export default nextConfig
