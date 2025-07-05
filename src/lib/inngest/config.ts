/**
 * Inngest configuration validation and helpers
 */

export function validateInngestConfig() {
  const isProduction = process.env.NODE_ENV === 'production'
  const isVercel = !!process.env.VERCEL
  
  if (isProduction) {
    if (isVercel) {
      // When using Vercel integration, environment variables are auto-configured
      console.log('✅ Using Vercel Inngest integration - environment variables auto-configured')
    } else {
      // Manual configuration - check for required environment variables
      const hasManualConfig = process.env.INNGEST_SIGNING_KEY && process.env.INNGEST_EVENT_KEY
      
      if (!hasManualConfig) {
        console.warn('⚠️ Inngest environment variables not found. Please set INNGEST_SIGNING_KEY and INNGEST_EVENT_KEY or use Vercel integration.')
      } else {
        console.log('✅ Inngest manual configuration detected')
      }
    }
    
    // Log configuration status for debugging
    console.log('📊 Inngest configuration status:', {
      hasEventKey: !!process.env.INNGEST_EVENT_KEY,
      hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
      isVercel: isVercel,
      environment: process.env.NODE_ENV,
      integrationMode: isVercel ? 'Vercel Integration' : 'Manual Configuration'
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
  isVercel: !!process.env.VERCEL,
  // Only include keys if manually configured (not using Vercel integration)
  eventKey: process.env.VERCEL ? undefined : process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.VERCEL ? undefined : process.env.INNGEST_SIGNING_KEY,
  webhookUrl: getInngestWebhookUrl(),
}
