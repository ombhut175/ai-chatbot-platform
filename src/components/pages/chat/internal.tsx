"use client"

import { useState, useEffect } from "react"
import { Shield, Lock, Users, AlertTriangle, MessageSquare, Clock } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { ChatWidget } from "@/components/chat/chat-widget"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"

export default function InternalChatPage() {
  const searchParams = useSearchParams()
  const botId = searchParams?.get("bot") ?? ""
  const { chatbots } = useAppStore()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<"admin" | "staff" | "viewer">("staff")
  
  // Find the chatbot
  const chatbot = chatbots.find(bot => bot.id === botId)

  // Simulate authentication check
  useEffect(() => {
    // In a real app, this would check actual authentication
    const mockAuth = () => {
      // Simulate a delay for auth check
      setTimeout(() => {
        setIsAuthenticated(true)
        setUserRole("staff") // Mock role assignment
      }, 1000)
    }
    
    mockAuth()
  }, [])

  // Mock login function
  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  if (!chatbot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
        <AnimatedCard className="p-12 text-center max-w-md" glow>
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">Chatbot Not Found</h1>
          <p className="text-muted-foreground">
            The requested internal chatbot could not be found or may have been removed.
          </p>
        </AnimatedCard>
      </div>
    )
  }

  if (chatbot.type !== "internal") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
        <AnimatedCard className="p-12 text-center max-w-md" glow>
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            This chatbot is not configured for internal access. Please contact your administrator.
          </p>
        </AnimatedCard>
      </div>
    )
  }

  if (!isAuthenticated) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">{chatbot.name}</h1>
                <p className="text-sm text-muted-foreground">Internal Staff Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="destructive" className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Internal
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Welcome Section */}
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-1000">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-blue-600 to-foreground bg-clip-text text-transparent">
                Welcome to Internal Support
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {chatbot.description || "Your secure internal assistant for staff inquiries and support."}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <AnimatedCard className="p-6 text-center" glow>
              <Lock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Secure Access</h3>
              <p className="text-sm text-muted-foreground">
                Protected environment for sensitive information
              </p>
            </AnimatedCard>
            
            <AnimatedCard className="p-6 text-center" glow>
              <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Staff Support</h3>
              <p className="text-sm text-muted-foreground">
                Specialized assistance for internal operations
              </p>
            </AnimatedCard>
            
            <AnimatedCard className="p-6 text-center" glow>
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Always Available</h3>
              <p className="text-sm text-muted-foreground">
                24/7 support for your team's needs
              </p>
            </AnimatedCard>
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground">Ready to get started? Use the chat assistant below! 👇</p>
          </div>
        </div>
      </div>

      <ChatWidget chatbotId={chatbot.id} />
    </div>
  )
} 