"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, Building, Sparkles, User, AlertCircle } from "lucide-react"
import { FloatingLabelInput } from "@/components/ui/floating-label-input"
import { GradientButton } from "@/components/ui/gradient-button"
import { Checkbox } from "@/components/ui/checkbox"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/hooks/use-auth"
import { AppRoute } from "@/helpers/string_const/routes"
  
export default function SignupForm() {
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isCreatingCompany, setIsCreatingCompany] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { signUpWithEmail, loading, error } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear form error when user starts typing
    if (formError) setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords don't match")
      return
    }
    if (!acceptTerms) {
      setFormError("Please accept the terms and conditions")
      return
    }
    if (isCreatingCompany && !formData.companyName.trim()) {
      setFormError("Please enter a company name")
      return
    }
    
    // Prepare metadata
    const metadata = {
      name: formData.name,
      ...(isCreatingCompany && { company_name: formData.companyName }),
      create_company: isCreatingCompany,
    }
    
    const result = await signUpWithEmail(formData.email, formData.password, metadata)
    
    if (result.success) {
      // Company creation is now handled by a database trigger, so we can redirect directly.
      router.push(AppRoute.DASHBOARD)
    }
    // Error handling is done by the useAuth hook
  }

  return (
    <>
      <div className="text-center mb-8 space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl shadow-lg shadow-secondary/25 mb-4 group hover:scale-110 transition-transform duration-300">
          <Sparkles className="text-white h-8 w-8 group-hover:rotate-12 transition-transform duration-300" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Create your account
          </h1>
          <p className="text-muted-foreground">Start building AI chatbots for your business</p>
        </div>
      </div>
      <AnimatedCard className="p-8 backdrop-blur-sm bg-card/80" glow>
        {(error || urlError || formError) && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError || error || urlError}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <FloatingLabelInput
              label="Full name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              icon={<User className="h-4 w-4" />}
              required
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-company"
                checked={isCreatingCompany}
                onCheckedChange={(checked) => setIsCreatingCompany(!!checked)}
                className="mt-1 transition-all duration-200 hover:scale-110"
              />
              <label htmlFor="create-company" className="text-sm leading-5 cursor-pointer">
                I want to create a new company
              </label>
            </div>
            {isCreatingCompany && (
              <FloatingLabelInput
                label="Company name"
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                icon={<Building className="h-4 w-4" />}
                required={isCreatingCompany}
              />
            )}
            <FloatingLabelInput
              label="Email address"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              required
            />
            <div className="relative">
              <FloatingLabelInput
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
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
            <div className="relative">
              <FloatingLabelInput
                label="Confirm password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              className="mt-1 transition-all duration-200 hover:scale-110"
            />
            <label htmlFor="terms" className="text-sm leading-5 cursor-pointer">
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-primary hover:text-primary/80 transition-colors duration-200 hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-primary hover:text-primary/80 transition-colors duration-200 hover:underline"
              >
                Privacy Policy
              </Link>
            </label>
          </div>
          <GradientButton type="submit" variant="secondary" className="w-full h-12" disabled={loading}>
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating account...</span>
              </div>
            ) : (
              "Create Account"
            )}
          </GradientButton>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </AnimatedCard>
    </>
  )
}
