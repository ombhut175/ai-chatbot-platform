"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/store"
import { userService } from "@/lib/services/user"
import { Skeleton } from "@/components/ui/skeleton"

const publicRoutes = ['/login', '/signup', '/']
const authRoutes = ['/login', '/signup']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    userProfile,
    supabaseUser,
    initializing,
    setUserProfile,
    setSupabaseUser,
    setInitializing,
    setError
  } = useAuthStore()
  
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const hasInitialized = useRef(false)
  const supabaseRef = useRef(supabase)

  // Initialize auth state
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    
    const initializeAuth = async () => {
      console.log('[AuthProvider] Starting initialization...')
      setInitializing(true)
      
      try {
        console.log('[AuthProvider] Creating Supabase client...')
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('[AuthProvider] Session result:', { session: !!session, error: !!error })
        
        if (error) {
          console.error('[AuthProvider] Auth session error:', error)
          setError(error.message)
          setInitializing(false)
          return
        }

        if (session?.user) {
          console.log('[AuthProvider] User found, setting user...')
          setSupabaseUser(session.user)
          
          // Fetch user profile with company data
          console.log('[AuthProvider] Fetching user profile...')
          const profile = await userService.getCurrentUserProfile()
          if (profile) {
            console.log('[AuthProvider] Profile fetched successfully')
            setUserProfile(profile)
          }
        } else {
          console.log('[AuthProvider] No session found')
        }
      } catch (error) {
        console.error('[AuthProvider] Auth initialization error:', error)
        setError('Failed to initialize authentication')
      } finally {
        console.log('[AuthProvider] Initialization complete')
        setInitializing(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSupabaseUser(session?.user ?? null)

      if (event === 'SIGNED_IN' && session?.user) {
        // Fetch user profile when signed in
        const profile = await userService.getCurrentUserProfile()
        if (profile) {
          setUserProfile(profile)
        }
        } else if (event === 'SIGNED_OUT') {
          setUserProfile(null)
          // Get current pathname inside the callback to avoid stale closure
          const currentPath = window.location.pathname
          // Only redirect if not already on auth pages
          if (!authRoutes.includes(currentPath)) {
            window.location.href = '/login'
          }
        }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUserProfile, setSupabaseUser, setInitializing, setError])

  // Handle redirects for authenticated users only
  // The middleware handles unauthenticated user redirects
  useEffect(() => {
    if (initializing) return

    // Only redirect authenticated users away from auth pages
    if (supabaseUser && authRoutes.includes(pathname)) {
      router.push('/dashboard')
    }
  }, [supabaseUser, pathname, initializing, router])

  // Loading state - but don't show loading screen on auth pages
  if (initializing && !authRoutes.includes(pathname)) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading your workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 