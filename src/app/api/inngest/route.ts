import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { functions } from '@/lib/inngest/functions'

// Create serve handler
// When using Vercel integration, signing key is auto-configured
const serveHandler = serve({
  client: inngest,
  functions,
  // Only add signing key if not using Vercel integration and key is explicitly provided
  ...(!process.env.VERCEL && process.env.INNGEST_SIGNING_KEY && {
    signingKey: process.env.INNGEST_SIGNING_KEY,
  }),
  // Disable landing page in production
  landingPage: process.env.NODE_ENV !== 'production',
  servePath: '/api/inngest',
})

// Export HTTP methods
export const { GET, POST, PUT } = serveHandler
