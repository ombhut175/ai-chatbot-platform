import { Suspense } from "react"
import InternalChatPage from "@/components/pages/chat/internal"

/**
 * @deprecated Use /chat route instead with chatbotId query parameter
 * This route is kept for backward compatibility
 * Example: /chat?chatbotId=your-internal-chatbot-id
 */
export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <InternalChatPage />
    </Suspense>
  )
}
