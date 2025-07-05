"use client"

import { useEffect, useState } from "react"

export default function DebugPage() {
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    
    // Check if Supabase env vars are accessible
    console.log("NEXT_PUBLIC_SUPABASE_URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    // Check for any console errors
    window.addEventListener('error', (e) => {
      setError(e.message)
    })
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <div className="space-y-2">
        <p>Mounted: {mounted ? "Yes" : "No"}</p>
        <p>Error: {error || "None"}</p>
        <p>Time: {new Date().toISOString()}</p>
      </div>
    </div>
  )
}
