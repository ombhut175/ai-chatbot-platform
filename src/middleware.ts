import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/inngest (Inngest webhook endpoint)
     * - api/chat (unified chat API - handles both public and internal)
     * - api/chat/public (public chat API with API key auth)
     * - api/chatbots/public (public chatbot data API)
     * - api/chatbots/details (chatbot details API - public accessible)
     * - chat (unified chat page - handles auth internally)
     * - chat/public (legacy public chat page)
     * - widget.js (the JS widget script)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - and other static assets
     */
    '/((?!api/inngest|api/chat|api/chat/public|api/chatbots/public/.*|api/chatbots/details/.*|chat(?!/internal)|widget\.js|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
