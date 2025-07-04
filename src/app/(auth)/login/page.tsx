import { Suspense } from "react";
import LoginForm from "@/components/pages/auth/login";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <Suspense fallback={
          <div className="w-full h-[600px] animate-pulse bg-card/50 rounded-2xl" />
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
