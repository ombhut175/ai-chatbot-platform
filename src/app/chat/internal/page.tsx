import { Suspense } from "react"
import InternalChatPage from "@/components/pages/chat/internal"

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
