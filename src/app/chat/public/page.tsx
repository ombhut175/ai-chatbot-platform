"use client"

import { useState } from "react"
import { Sparkles, MessageSquare, Zap, Clock, Users, ArrowRight } from "lucide-react"
import { ChatWidget } from "@/components/chat/chat-widget"
import { AnimatedCard } from "@/components/ui/animated-card"
import { GradientButton } from "@/components/ui/gradient-button"

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Get instant responses powered by advanced AI technology",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: MessageSquare,
    title: "Natural Conversations",
    description: "Chat naturally with our AI that understands context",
    color: "from-blue-500 to-purple-500",
  },
  {
    icon: Clock,
    title: "24/7 Available",
    description: "Always here when you need assistance, day or night",
    color: "from-green-500 to-teal-500",
  },
  {
    icon: Users,
    title: "Personalized Help",
    description: "Tailored responses based on your specific needs",
    color: "from-purple-500 to-pink-500",
  },
]

const sampleQuestions = [
  "How do I reset my password?",
  "What are your business hours?",
  "Can you help me with billing?",
  "How do I contact support?",
]

export default function PublicChatPage() {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-6xl mx-auto text-center space-y-12">
          {/* Hero Section */}
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-1000">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl shadow-2xl shadow-primary/25 mb-6 group hover:scale-110 transition-transform duration-300">
              <Sparkles className="text-white h-10 w-10 group-hover:rotate-12 transition-transform duration-300" />
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                Welcome to Our
                <br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  AI Support
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Get instant, intelligent assistance from our AI-powered support system. Available 24/7 to help you with
                anything you need.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <GradientButton className="group text-lg px-8 py-4">
                <MessageSquare className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                Start Chatting Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </GradientButton>
              <p className="text-sm text-muted-foreground">Click the chat button in the bottom right corner</p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {features.map((feature, index) => (
              <AnimatedCard
                key={feature.title}
                className="p-6 text-center group animate-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${index * 200}ms` }}
                glow
              >
                <div className="space-y-4">
                  <div className="relative">
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500`}
                    />
                    <div
                      className={`relative p-4 bg-gradient-to-r ${feature.color} rounded-2xl text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 inline-flex`}
                    >
                      <feature.icon className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>

          {/* Sample Questions */}
          <AnimatedCard
            className="p-8 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-1000 delay-500"
            glow
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Try asking me something</h2>
                <p className="text-muted-foreground">Here are some popular questions to get you started</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {sampleQuestions.map((question, index) => (
                  <button
                    key={question}
                    onClick={() => setSelectedQuestion(question)}
                    className="p-4 text-left border rounded-xl hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 group animate-in slide-in-from-bottom-2 duration-500"
                    style={{ animationDelay: `${index * 100 + 600}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium group-hover:text-primary transition-colors duration-300">
                        {question}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </AnimatedCard>

          {/* Call to Action */}
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-1000 delay-700">
            <p className="text-lg text-muted-foreground">Ready to get started? Click the chat button below! 👇</p>
          </div>
        </div>
      </div>

      <ChatWidget chatbotId="demo-bot" />
    </div>
  )
}
