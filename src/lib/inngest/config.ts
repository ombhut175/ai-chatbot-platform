/**
 * Inngest configuration validation and helpers
 */

export function validateInngestConfig() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    // When using Vercel integration, these might be auto-configured
    const hasVercelIntegration = process.env.INNGEST_SIGNING_KEY || process.env.INNGEST_EVENT_KEY
    
    if (!hasVercelIntegration) {
      console.warn('⚠️ Inngest environment variables not found. If using Vercel integration, they may be auto-configured.')
    } else {
      console.log('✅ Inngest configuration detected')
    }
    
    // Log configuration status for debugging
    console.log('📊 Inngest configuration status:', {
      hasEventKey: !!process.env.INNGEST_EVENT_KEY,
      hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
      isVercel: !!process.env.VERCEL,
      environment: process.env.NODE_ENV
    })
  } else {
    console.log('🔧 Running Inngest in development mode')
  }
}

export function getInngestWebhookUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
  
  if (!appUrl) {
    console.warn('⚠️ No app URL configured, using relative path')
    return '/api/inngest'
  }
  
  // Ensure URL has protocol
  const baseUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`
  return `${baseUrl}/api/inngest`
}

export const inngestConfig = {
  isProduction: process.env.NODE_ENV === 'production',
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  webhookUrl: getInngestWebhookUrl(),
}
