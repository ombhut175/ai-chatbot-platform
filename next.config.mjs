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
  webpack: (config, { dev, isServer }) => {
    // Enable source maps in development
    if (dev) {
      config.devtool = 'eval-source-map'
    }
    
    // Handle browser-specific modules for serverless compatibility
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false
    
    return config
  },
}

export default nextConfig
