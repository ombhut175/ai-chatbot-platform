import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { functions } from '@/lib/inngest/functions'

// Serve Inngest functions via the /api/inngest endpoint
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
}) 