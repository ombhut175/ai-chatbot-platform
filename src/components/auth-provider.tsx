"use client"

import { useEffect } from "react"
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

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setInitializing(true)
      
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth session error:', error)
          setError(error.message)
          setInitializing(false)
          return
        }

        if (session?.user) {
          setSupabaseUser(session.user)
          
          // Fetch user profile with company data
          const profile = await userService.getCurrentUserProfile()
          if (profile) {
            setUserProfile(profile)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setError('Failed to initialize authentication')
      } finally {
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
        // Only redirect if not already on auth pages
        if (!authRoutes.includes(pathname)) {
          router.push('/login')
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, setSupabaseUser, setUserProfile, setInitializing, setError, pathname, router])

  // Handle redirects in useEffect to avoid render-time side effects
  useEffect(() => {
    if (initializing) return

    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/chat/')
    const isAuthRoute = authRoutes.includes(pathname)

    // Redirect unauthenticated users to login
    if (!supabaseUser && !isPublicRoute) {
      router.push('/login')
      return
    }

    // Redirect authenticated users away from auth pages
    if (supabaseUser && isAuthRoute) {
      router.push('/dashboard')
      return
    }
  }, [supabaseUser, pathname, initializing, router])

  // Loading state
  if (initializing) {
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