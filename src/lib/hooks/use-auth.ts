'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: false,
    error: null,
  })
  const [isInitializing, setIsInitializing] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        
        if (error) {
          setAuthState({ user: null, loading: false, error: error.message })
        } else {
          setAuthState({ user: session?.user ?? null, loading: false, error: null })
        }
      } catch (err) {
        console.error('[useAuth] Error getting initial session:', err)
        setAuthState({ user: null, loading: false, error: 'Failed to get session' })
      } finally {
        setIsInitializing(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthState({
        user: session?.user ?? null,
        loading: false,
        error: null,
      })

      // Only redirect on explicit sign out, and avoid redirecting if already on auth pages
      if (event === 'SIGNED_OUT' && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, pathname])

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true }))
    
    try {
      // Sign out from Supabase client only
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }))
      } else {
        setAuthState({ user: null, loading: false, error: null })
        router.push('/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
      setAuthState(prev => ({ ...prev, loading: false, error: 'Failed to logout' }))
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }))
      return { success: false, error: error.message }
    }

    setAuthState({ user: data.user, loading: false, error: null })
    return { success: true, user: data.user }
  }

  const signUpWithEmail = async (email: string, password: string, metadata?: any) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }))
      return { success: false, error: error.message }
    }

    setAuthState(prev => ({ ...prev, loading: false }))
    return { success: true, user: data.user }
  }

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    isAuthenticated: !!authState.user,
  }
} 