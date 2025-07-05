"use client"

import { useState } from "react"
import { Calendar, TrendingUp, Users, MessageSquare, Clock, BarChart3, PieChart, Activity } from "lucide-react"

import { AnimatedCard } from "@/components/ui/animated-card"
import { StatsCard } from "@/components/ui/stats-card"
import { GradientButton } from "@/components/ui/gradient-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const analyticsData = {
  overview: [
    {
      title: "Total Conversations",
      value: "2,847",
      description: "This month",
      icon: MessageSquare,
    },
    {
      title: "Active Users",
      value: "1,234",
      description: "Last 30 days",
      icon: Users,
    },
    {
      title: "Avg Response Time",
      value: "1.2s",
      description: "Average response",
      icon: Clock,
    },
    {
      title: "Satisfaction Rate",
      value: "94.5%",
      description: "User satisfaction",
      icon: TrendingUp,
    },
  ],
  chatbotPerformance: [
    { name: "Customer Support Bot", conversations: 1247, satisfaction: 96, responseTime: "0.8s" },
    { name: "HR Assistant", conversations: 892, satisfaction: 91, responseTime: "1.1s" },
    { name: "Sales Bot", conversations: 708, satisfaction: 89, responseTime: "1.4s" },
  ],
  topQuestions: [
    { question: "How do I reset my password?", count: 234, category: "Account" },
    { question: "What are your business hours?", count: 189, category: "General" },
    { question: "How can I cancel my subscription?", count: 156, category: "Billing" },
    { question: "Do you offer refunds?", count: 143, category: "Billing" },
    { question: "How do I contact support?", count: 128, category: "Support" },
  ],
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Analytics Dashboard 📊
          </h2>
          <p className="text-lg text-muted-foreground">Monitor your chatbot performance and user engagement</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 bg-card/50 backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <GradientButton className="group">
            <BarChart3 className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
            Export Report
          </GradientButton>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {analyticsData.overview.map((stat, index) => (
          <div
            key={stat.title}
            className="animate-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm">
          <TabsTrigger value="performance" className="transition-all duration-300">
            Performance
          </TabsTrigger>
          <TabsTrigger value="conversations" className="transition-all duration-300">
            Conversations
          </TabsTrigger>
          <TabsTrigger value="insights" className="transition-all duration-300">
            Insights
          </TabsTrigger>
          <TabsTrigger value="reports" className="transition-all duration-300">
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chatbot Performance */}
            <AnimatedCard className="p-6" glow>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Chatbot Performance</h3>
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-4">
                  {analyticsData.chatbotPerformance.map((bot, index) => (
                    <div
                      key={bot.name}
                      className="p-4 rounded-lg border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:bg-card/80 animate-in slide-in-from-left-4 duration-700"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{bot.name}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{bot.responseTime}</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Conversations</p>
                          <p className="font-semibold text-lg">{bot.conversations.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Satisfaction</p>
                          <p className="font-semibold text-lg text-green-600">{bot.satisfaction}%</p>
                        </div>
                      </div>
                      <div className="mt-3 bg-muted rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${bot.satisfaction}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedCard>

            {/* Top Questions */}
            <AnimatedCard className="p-6" glow>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Top Questions</h3>
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-3">
                  {analyticsData.topQuestions.map((question, index) => (
                    <div
                      key={question.question}
                      className="p-3 rounded-lg border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:bg-card/80 animate-in slide-in-from-right-4 duration-700"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {question.category}
                        </span>
                        <span className="text-sm font-medium">{question.count} asks</span>
                      </div>
                      <p className="text-sm font-medium">{question.question}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedCard>
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <AnimatedCard className="p-6" glow>
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Conversation Analytics</h3>
              <p className="text-muted-foreground mb-6">
                Detailed conversation flow and user journey analysis coming soon
              </p>
              <GradientButton>
                <PieChart className="mr-2 h-4 w-4" />
                View Conversation Flows
              </GradientButton>
            </div>
          </AnimatedCard>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <AnimatedCard className="p-6" glow>
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
              <p className="text-muted-foreground mb-6">
                Get intelligent recommendations to improve your chatbot performance
              </p>
              <GradientButton>
                <Activity className="mr-2 h-4 w-4" />
                Generate Insights
              </GradientButton>
            </div>
          </AnimatedCard>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <AnimatedCard className="p-6" glow>
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Custom Reports</h3>
              <p className="text-muted-foreground mb-6">Create and schedule custom reports for your team</p>
              <GradientButton>
                <Calendar className="mr-2 h-4 w-4" />
                Create Report
              </GradientButton>
            </div>
          </AnimatedCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
