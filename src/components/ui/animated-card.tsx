"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hover?: boolean
  glow?: boolean
}

export function AnimatedCard({ children, className, hover = true, glow = false, ...props }: AnimatedCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300",
        hover && "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
        glow && "hover:shadow-2xl hover:shadow-primary/10",
        "group relative overflow-hidden",
        className,
      )}
      {...props}
    >
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
