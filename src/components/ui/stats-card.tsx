"use client"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatedCard } from "./animated-card"

interface StatsCardProps {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({ title, value, description, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <AnimatedCard className={cn("p-6", className)} hover glow>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors duration-300">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>
    </AnimatedCard>
  )
}
