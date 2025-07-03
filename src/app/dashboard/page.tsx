"use client"

import { useEffect } from "react"
import { Plus, Upload, MessageSquare, Database, Bot, TrendingUp, Zap, Users, Clock } from "lucide-react"
import Link from "next/link"
import { AppRoute } from "@/helpers/string_const/routes"

import { GradientButton } from "@/components/ui/gradient-button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { StatsCard } from "@/components/ui/stats-card"
import { useAuthStore, useAppStore } from "@/lib/store"
import { mockChatbots, mockDataSources } from "@/lib/mock-data"

const statsData = [
  {
    title: "Total Chatbots",
    value: "2",
    description: "Active chatbots",
    icon: Bot,
    trend: { value: 12, isPositive: true },
  },
  {
    title: "Data Sources",
    value: "3",
    description: "Connected sources",
    icon: Database,
    trend: { value: 8, isPositive: true },
  },
  {
    title: "Messages Today",
    value: "47",
    description: "+12% from yesterday",
    icon: MessageSquare,
    trend: { value: 12, isPositive: true },
  },
  {
    title: "Active Chats",
    value: "3",
    description: "Currently online",
    icon: TrendingUp,
    trend: { value: 5, isPositive: false },
  },
]

const quickActions = [
  {
    title: "Upload Data Source",
    description: "Add new knowledge to your chatbots",
    icon: Upload,
    color: "from-blue-500 to-blue-600",
    href: AppRoute.DASHBOARD_DATA,
  },
  {
    title: "Create New Chatbot",
    description: "Build your next AI assistant",
    icon: Bot,
    color: "from-purple-500 to-purple-600",
    href: AppRoute.DASHBOARD_CHATBOTS,
  },
  {
    title: "Test Chat Interface",
    description: "Try out your chatbots",
    icon: MessageSquare,
    color: "from-green-500 to-green-600",
    href: AppRoute.CHAT_PUBLIC,
  },
  {
    title: "View Analytics",
    description: "Monitor performance metrics",
    icon: TrendingUp,
    color: "from-orange-500 to-orange-600",
    href: AppRoute.DASHBOARD_ANALYTICS,
  },
]

const recentActivity = [
  {
    id: "1",
    action: "New chatbot created",
    description: "Customer Support Bot was created",
    time: "2 hours ago",
    type: "success",
    icon: Bot,
  },
  {
    id: "2",
    action: "Data source uploaded",
    description: "Product Documentation.pdf was processed",
    time: "4 hours ago",
    type: "info",
    icon: Upload,
  },
  {
    id: "3",
    action: "Integration activated",
    description: "Website widget was embedded",
    time: "1 day ago",
    type: "success",
    icon: Zap,
  },
  {
    id: "4",
    action: "User messages received",
    description: "47 new messages from customers",
    time: "2 days ago",
    type: "info",
    icon: Users,
  },
]

export default function DashboardPage() {
  const { userProfile } = useAuthStore()
  const { setChatbots, setDataSources } = useAppStore()

  useEffect(() => {
    setChatbots(mockChatbots)
    setDataSources(mockDataSources)
  }, [setChatbots, setDataSources])

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Welcome back, {userProfile?.name?.split(" ")[0] || "User"}! 👋
          </h2>
          <p className="text-lg text-muted-foreground">Here's what's happening with your AI chatbots today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/dashboard/data">
            <GradientButton variant="outline" className="group">
              <Upload className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              Upload Data
            </GradientButton>
          </Link>
          <Link href="/dashboard/chatbots">
            <GradientButton className="group">
              <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              Create Chatbot
            </GradientButton>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <div
            key={stat.title}
            className="animate-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        {/* Quick Actions */}
        <AnimatedCard className="col-span-4 p-6" glow>
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold mb-2">Quick Actions</h3>
              <p className="text-muted-foreground">Get started with these common tasks</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {quickActions.map((action, index) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer animate-in slide-in-from-left-4 duration-700 block"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />
                  <div className="relative z-10 space-y-3">
                    <div
                      className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${action.color} text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
                    >
                      <action.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </AnimatedCard>

        {/* Recent Activity */}
        <AnimatedCard className="col-span-3 p-6" glow>
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold mb-2">Recent Activity</h3>
              <p className="text-muted-foreground">Your latest platform activities</p>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-4 p-3 rounded-lg transition-all duration-300 hover:bg-muted/50 group animate-in slide-in-from-right-4 duration-700"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-110 ${
                      activity.type === "success"
                        ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    }`}
                  >
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  )
}
