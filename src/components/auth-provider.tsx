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
  const isRedirecting = useRef(false)

  // Initialize auth state
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    
    const initializeAuth = async () => {
      console.log('[AuthProvider] Starting initialization...')
      setInitializing(true)
      
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('[AuthProvider] Initialization timeout - forcing complete')
        setInitializing(false)
      }, 5000) // 5 second timeout
      
      try {
        console.log('[AuthProvider] Creating Supabase client...')
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('[AuthProvider] Session result:', { session: !!session, error: !!error })
        
        if (error) {
          console.error('[AuthProvider] Auth session error:', error)
          setError(error.message)
          clearTimeout(timeoutId)
          setInitializing(false)
          return
        }

        if (session?.user) {
          console.log('[AuthProvider] User found, setting user...')
          setSupabaseUser(session.user)
          
          // Fetch user profile with company data
          console.log('[AuthProvider] Fetching user profile...')
          try {
            const profile = await userService.getCurrentUserProfile()
            if (profile) {
              console.log('[AuthProvider] Profile fetched successfully:', {
                id: profile.id,
                email: profile.email,
                company_id: profile.company_id,
                hasCompany: !!profile.company
              })
              setUserProfile(profile)
            } else {
              // If profile is null, try to refetch after a short delay
              console.log('[AuthProvider] Profile not found, retrying...')
              // Retry up to 3 times with increasing delays
              let retryCount = 0
              const maxRetries = 3
              const retryDelays = [500, 1000, 2000]
              
              const retryFetch = async () => {
                if (retryCount >= maxRetries) {
                  console.error('[AuthProvider] Max retries reached, profile still not found')
                  return
                }
                
                const delay = retryDelays[retryCount] || 2000
                retryCount++
                
                await new Promise(resolve => setTimeout(resolve, delay))
                const retryProfile = await userService.getCurrentUserProfile()
                
                if (retryProfile) {
                  console.log(`[AuthProvider] Profile fetched on retry #${retryCount}`)
                  setUserProfile(retryProfile)
                } else {
                  console.log(`[AuthProvider] Profile not found on retry #${retryCount}`)
                  retryFetch() // Try again
                }
              }
              
              retryFetch()
            }
          } catch (profileError) {
            console.error('[AuthProvider] Failed to fetch profile:', profileError)
            // Don't fail initialization if profile fetch fails
          }
        } else {
          console.log('[AuthProvider] No session found')
        }
      } catch (error) {
        console.error('[AuthProvider] Auth initialization error:', error)
        setError('Failed to initialize authentication')
      } finally {
        clearTimeout(timeoutId)
        console.log('[AuthProvider] Initialization complete')
        setInitializing(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state change:', event)
      
      // Always update user state immediately
      setSupabaseUser(session?.user ?? null)

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[AuthProvider] User signed in, fetching profile...')
        
        // Fetch profile asynchronously without blocking
        userService.getCurrentUserProfile().then(profile => {
          if (profile) {
            console.log('[AuthProvider] Profile fetched after sign in:', {
              id: profile.id,
              email: profile.email,
              company_id: profile.company_id,
              hasCompany: !!profile.company
            })
            setUserProfile(profile)
          } else {
            // Retry profile fetch if null with better logic
            console.log('[AuthProvider] Profile null after sign in, implementing retry strategy...')
            let retryCount = 0
            const maxRetries = 3
            const retryDelays = [500, 1000, 2000]
            
            const retryFetch = async () => {
              if (retryCount >= maxRetries) {
                console.error('[AuthProvider] Max retries reached after sign in, profile still not found')
                return
              }
              
              const delay = retryDelays[retryCount] || 2000
              retryCount++
              
              await new Promise(resolve => setTimeout(resolve, delay))
              const retryProfile = await userService.getCurrentUserProfile()
              
              if (retryProfile) {
                console.log(`[AuthProvider] Profile fetched on retry #${retryCount} after sign in`)
                setUserProfile(retryProfile)
              } else {
                console.log(`[AuthProvider] Profile not found on retry #${retryCount} after sign in`)
                retryFetch() // Try again
              }
            }
            
            retryFetch()
          }
        }).catch(err => {
          console.error('[AuthProvider] Error fetching profile after sign in:', err)
        })
        
        // Handle redirect for newly signed in users
        const currentPath = window.location.pathname
        if (authRoutes.includes(currentPath) && !isRedirecting.current) {
          console.log('[AuthProvider] Redirecting from auth page to dashboard')
          isRedirecting.current = true
          // Small delay to ensure state updates are processed
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 100)
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
    // Use replace instead of push to avoid history issues
    if (supabaseUser && authRoutes.includes(pathname) && !isRedirecting.current) {
      console.log('[AuthProvider] Client-side redirect: authenticated user on auth page')
      isRedirecting.current = true
      router.replace('/dashboard')
    }
  }, [supabaseUser, pathname, initializing, router])

  // Loading state - but don't show loading screen on auth pages
  if (initializing && !authRoutes.includes(pathname) && !publicRoutes.includes(pathname)) {
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