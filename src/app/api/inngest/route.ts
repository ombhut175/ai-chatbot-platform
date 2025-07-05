import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { functions } from '@/lib/inngest/functions'

// Create serve handler
// Vercel integration auto-configures signing key
const serveHandler = serve({
  client: inngest,
  functions,
  // Only add signing key if explicitly provided
  ...(process.env.INNGEST_SIGNING_KEY && {
    signingKey: process.env.INNGEST_SIGNING_KEY,
  }),
  // Disable landing page in production
  landingPage: process.env.NODE_ENV !== 'production',
  servePath: '/api/inngest',
})

// Export HTTP methods
export const { GET, POST, PUT } = serveHandler
