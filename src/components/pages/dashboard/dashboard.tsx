"use client"

import { useEffect, useMemo } from "react"
import {
  Plus,
  Upload,
  MessageSquare,
  Database,
  Bot,
  TrendingUp,
  Zap,
  Users,
  Clock,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { AppRoute } from "@/helpers/string_const/routes"

import { GradientButton } from "@/components/ui/gradient-button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { StatsCard } from "@/components/ui/stats-card"
import { useAuthStore } from "@/lib/store"
import { useDashboardData } from "@/hooks/use-dashboard"
import { useChatbots } from "@/hooks/use-chatbots"




export default function Dashboard() {
  const { userProfile, initializing, supabaseUser } = useAuthStore()
  const { stats, activities, isLoading, error } = useDashboardData()
  const { chatbots } = useChatbots()

  // Debug logging
  console.log('🏠 Dashboard render:', {
    userProfile: userProfile ? {
      id: userProfile.id,
      email: userProfile.email,
      company_id: userProfile.company_id,
      hasCompany: !!userProfile.company
    } : null,
    stats,
    activitiesCount: activities?.length || 0,
    isLoading,
    error: error?.message || error,
    chatbotsCount: chatbots?.length || 0
  })

  // Get the first active chatbot ID for the chat link
  const firstActiveChatbotId = useMemo(() => {
    const activeChatbot = chatbots.find(bot => bot.is_active)
    return activeChatbot?.id || 'sample'
  }, [chatbots])

  // Define quick actions with dynamic chat link
  const quickActions = useMemo(() => [
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
      href: AppRoute.CHAT + `?chatbotId=${firstActiveChatbotId}`,
    },
    {
      title: "View Analytics",
      description: "Monitor performance metrics",
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600",
      href: AppRoute.DASHBOARD_ANALYTICS,
    },
  ], [firstActiveChatbotId])

  // Generate stats data from API response with fallback
  const statsData = useMemo(() => {
    // Use fallback data if no stats available yet
    const fallbackStats = {
      totalChatbots: 0,
      totalDataSources: 0,
      messagesToday: 0,
      activeChats: 0
    }
    
    const currentStats = stats || fallbackStats
    
    return [
      {
        title: "Total Chatbots",
        value: currentStats.totalChatbots.toString(),
        description: currentStats.totalChatbots > 0 ? "Active chatbots" : "No chatbots yet",
        icon: Bot,
      },
      {
        title: "Data Sources",
        value: currentStats.totalDataSources.toString(),
        description: currentStats.totalDataSources > 0 ? "Connected sources" : "No data sources yet",
        icon: Database,
      },
      {
        title: "Messages Today",
        value: currentStats.messagesToday.toString(),
        description: currentStats.messagesToday > 0 ? "from yesterday" : "No messages today",
        icon: MessageSquare,
      },
      {
        title: "Active Chats",
        value: currentStats.activeChats.toString(),
        description: currentStats.activeChats > 0 ? "Currently online" : "No active chats",
        icon: TrendingUp,
      },
    ]
  }, [stats])

  // Map icon strings to actual icon components
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Bot': return Bot
      case 'Upload': return Upload
      case 'Zap': return Zap
      case 'Users': return Users
      default: return MessageSquare
    }
  }

  // Show loading state
  if (isLoading || initializing || (supabaseUser && !userProfile)) {
    return (
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show message if no company_id (user not properly set up)
  if (!userProfile?.company_id) {
    return (
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-lg bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
              <h3 className="font-semibold mb-2">Setup Required</h3>
              <p>Your account needs to be associated with a company to view the dashboard.</p>
              <p className="text-sm mt-2">Please contact support or complete your account setup.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
              Failed to load dashboard data
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Welcome back, {userProfile?.name?.split(" ")[0] || "User"}! 👋
          </h2>
          <p className="text-lg text-muted-foreground">
            Here's what's happening with your AI chatbots today.
          </p>
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
              <p className="text-muted-foreground">
                Get started with these common tasks
              </p>
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
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
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
              <p className="text-muted-foreground">
                Your latest platform activities
              </p>
            </div>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity, index) => {
                  const IconComponent = getIconComponent(activity.icon)
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-4 p-3 rounded-lg transition-all duration-300 hover:bg-muted/50 group animate-in slide-in-from-right-4 duration-700"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div
                        className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-110 ${
                          activity.type === "success"
                            ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                            : activity.type === "error" 
                            ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.action}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-2">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No recent activity yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start by creating a chatbot or uploading data
                  </p>
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Debug Section - Remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <AnimatedCard className="p-4 bg-gray-50 dark:bg-gray-900">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium mb-2">🔧 Debug Information</summary>
            <div className="space-y-2 text-xs">
              <div><strong>User Profile:</strong> {userProfile ? 'Present' : 'Missing'}</div>
              <div><strong>Company ID:</strong> {userProfile?.company_id || 'None'}</div>
              <div><strong>Stats Data:</strong> {stats ? 'Loaded' : 'Not loaded'}</div>
              <div><strong>Activities:</strong> {activities?.length || 0} items</div>
              <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
              <div><strong>Error:</strong> {error ? error.toString() : 'None'}</div>
              <div><strong>API Endpoints:</strong></div>
              <div className="ml-4">
                <a href="/api/test-dashboard" target="_blank" className="text-blue-500 hover:underline">
                  Test Dashboard API
                </a>
              </div>
              <div className="ml-4">
                <a href="/api/health" target="_blank" className="text-blue-500 hover:underline">
                  Health Check
                </a>
              </div>
            </div>
          </details>
        </AnimatedCard>
      )}
    </div>
  )
}
