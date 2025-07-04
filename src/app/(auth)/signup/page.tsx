import { Suspense } from "react";
import SignupForm from "@/components/pages/auth/signup";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/5 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <Suspense fallback={
          <div className="w-full h-[600px] animate-pulse bg-card/50 rounded-2xl" />
        }>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
