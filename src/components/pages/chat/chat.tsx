"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Shield, Lock, Users, Bot, Sparkles, Star, MessageCircle, User } from "lucide-react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import PublicChatPage from "@/components/pages/chat/public"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Badge } from "@/components/ui/badge"

// Loading component
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}

// Main chat component
function UnifiedChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const chatbotId = searchParams?.get('chatbotId')
  
  const [isLoading, setIsLoading] = useState(true)
  const [chatbot, setChatbot] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [requiresAuth, setRequiresAuth] = useState(false)

  useEffect(() => {
    const checkChatbotAndAuth = async () => {
      if (!chatbotId) {
        setError('No chatbot ID provided')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Check if user is authenticated first
        const supabase = createClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (currentUser) {
          setIsAuthenticated(true)
          setUser(currentUser)
        }

        // Fetch chatbot details using the unified endpoint
        const response = await fetch(`/api/chatbots/details/${chatbotId}`)
        const data = await response.json()

        if (response.status === 401) {
          // This is an internal chatbot that requires authentication
          setRequiresAuth(true)
          if (!currentUser) {
            setError('Authentication required for internal chatbots')
          } else {
            // User is authenticated but token might be expired or not authorized
            setError('Please login again to access this internal chatbot')
          }
        } else if (response.status === 403) {
          // User is authenticated but doesn't have access
          setRequiresAuth(true)
          setError(data.error || 'Not authorized to access this chatbot')
        } else if (response.status === 404) {
          setError('Chatbot not found or inactive')
        } else if (data.success && data.data) {
          // Successfully loaded chatbot
          setChatbot(data.data)
          setRequiresAuth(data.data.type === 'internal')
          
          if (data.data.type === 'internal' && currentUser) {
            // For internal chatbots, we got the data, which means user is authenticated and authorized
            setIsAuthenticated(true)
            setError(null) // Clear any previous errors
          }
        } else {
          setError(data.error || 'Failed to load chatbot')
        }
      } catch (err) {
        console.error('Failed to load chatbot:', err)
        setError('Failed to load chatbot')
      } finally {
        setIsLoading(false)
      }
    }

    checkChatbotAndAuth()
  }, [chatbotId])

  // Handle login
  const handleLogin = () => {
    router.push(`/login?redirect=/chat?chatbotId=${chatbotId}`)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-center"
        >
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-2xl opacity-30 animate-pulse" />
            <div className="relative p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full inline-flex shadow-2xl">
              <Bot className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-center gap-1 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">Loading chatbot...</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Verifying access permissions</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Error state - No chatbot ID
  if (!chatbotId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full p-8 text-center shadow-xl">
            <div className="mb-4">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Chatbot Selected</h2>
            <p className="text-muted-foreground">
              Please provide a valid chatbot ID in the URL parameters.
            </p>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <code className="bg-background px-2 py-1 rounded text-xs">
                  /chat?chatbotId=your-chatbot-id
                </code>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Authentication required state (for internal chatbots)
  if (requiresAuth && !isAuthenticated && !chatbot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue/5 flex items-center justify-center p-4">
        <AnimatedCard className="p-12 text-center max-w-lg" glow>
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
              <div className="relative p-6 bg-blue-500/10 rounded-full inline-flex">
                <Shield className="h-16 w-16 text-blue-600" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">Internal Access Required</h1>
              <p className="text-muted-foreground">
                This is a secure internal chatbot that requires staff authentication to access.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Secure Environment</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Protected access for authorized personnel only
              </p>
            </div>

            <Button onClick={handleLogin} className="w-full" size="lg">
              <Users className="mr-2 h-5 w-5" />
              Staff Login
            </Button>

            <p className="text-xs text-muted-foreground">
              Contact your system administrator if you need access credentials
            </p>
          </div>
        </AnimatedCard>
      </div>
    )
  }

  // Access denied state (authenticated but not authorized)
  if (error && !chatbot) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full p-8 text-center shadow-xl">
            <div className="mb-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {requiresAuth ? 'Access Denied' : 'Error'}
            </h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            
            {/* Show user info if authenticated but not authorized */}
            {isAuthenticated && user && (
              <div className="mb-6 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Currently logged in as:</p>
                <p className="font-medium">{user.email}</p>
              </div>
            )}
            
            {requiresAuth && (
              <Button onClick={handleLogin} className="w-full">
                {isAuthenticated ? 'Login with Different Account' : 'Login to Continue'}
              </Button>
            )}
          </Card>
        </motion.div>
      </div>
    )
  }

  // Successfully loaded chatbot
  if (chatbot) {
    if (chatbot.type === 'internal' && isAuthenticated) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-200 rounded-full blur-3xl animate-pulse" />
          </div>
          <div className="relative z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
            <div className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-purple-500/10 rounded-xl">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{chatbot.name}</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Exclusive Staff Chat</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Internal
                  </Badge>
                  {user && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {user.email}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="relative z-10">
            <PublicChatPage preloadedChatbot={chatbot} />
          </div>
        </div>
      )
    }
    return <PublicChatPage preloadedChatbot={chatbot} />
  }

  // Fallback (should not reach here)
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground">Please try refreshing the page.</p>
      </Card>
    </div>
  )
}

// Main page component with Suspense boundary
export default function UnifiedChatPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <UnifiedChatContent />
    </Suspense>
  )
}
