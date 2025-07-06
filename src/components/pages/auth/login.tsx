"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, Sparkles, AlertCircle } from "lucide-react"
import { FloatingLabelInput } from "@/components/ui/floating-label-input"
import { GradientButton } from "@/components/ui/gradient-button"
import { Checkbox } from "@/components/ui/checkbox"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/hooks/use-auth"
import { AppRoute } from "@/helpers/string_const/routes"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { signInWithEmail, loading, error } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const redirectTo = searchParams.get('redirect') || AppRoute.DASHBOARD

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (isSubmitting || loading) return
    
    setIsSubmitting(true)
    
    try {
      const result = await signInWithEmail(email, password)
      
      if (result.success) {
        // Use replace to avoid back button issues
        // Don't reset isSubmitting to prevent multiple redirects
        router.replace(redirectTo)
      } else {
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="text-center mb-8 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg shadow-primary/25 mb-4 group hover:scale-110 transition-transform duration-300">
          <Sparkles className="text-white h-8 w-8 group-hover:rotate-12 transition-transform duration-300" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-muted-foreground">Sign in to your account to continue your AI journey</p>
        </div>
      </div>
      <AnimatedCard className="p-8 backdrop-blur-sm bg-card/80" glow>
        {(error || urlError) && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || urlError}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <FloatingLabelInput
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              required
            />
            <div className="relative">
              <FloatingLabelInput
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="transition-all duration-200 hover:scale-110"
              />
              <label htmlFor="remember" className="text-sm font-medium cursor-pointer">
                Remember me
              </label>
            </div>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary/80 transition-colors duration-200 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <GradientButton type="submit" className="w-full h-12" disabled={loading || isSubmitting}>
            {(loading || isSubmitting) ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </GradientButton>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href={AppRoute.SIGNUP}
                className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </AnimatedCard>
    </>
  )
}
