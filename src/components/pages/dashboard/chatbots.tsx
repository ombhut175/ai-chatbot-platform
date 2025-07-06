"use client"

import { useState } from "react"
import { Plus, Bot, Settings, Play, Pause, Eye, Trash2, AlertCircle, Plug, RefreshCw } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useDataSources } from "@/hooks/use-data-sources"
import { useChatbots, useCreateChatbot, useDeleteChatbot, useToggleChatbotStatus } from "@/hooks/use-chatbots"
import type { Chatbot } from "@/lib/types"
import { ChatbotType, ChatbotPersonality } from "@/helpers/string_const/chatbot"
import { AnimatedCard } from "@/components/ui/animated-card"
import { GradientButton } from "@/components/ui/gradient-button"

export default function ChatbotsPage() {
  const { chatbots, isLoading, error, mutate } = useChatbots()
  const { dataSources } = useDataSources()
  const { createChatbot } = useCreateChatbot()
  const { deleteChatbot: deleteChatbotApi } = useDeleteChatbot()
  const { toggleStatus } = useToggleChatbotStatus()
  
  const [togglingChatbotId, setTogglingChatbotId] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newChatbot, setNewChatbot] = useState({
    name: "",
    description: "",
    type: ChatbotType.PUBLIC,
    welcome_message: "Hello! How can I help you today?",
    personality: ChatbotPersonality.PROFESSIONAL,
    selectedDataSources: [] as string[],
  })

  const handleCreateChatbot = async () => {
    if (!newChatbot.name || !newChatbot.description || isCreating) return

    setIsCreating(true)
    try {
      await createChatbot({
        name: newChatbot.name,
        description: newChatbot.description,
        type: newChatbot.type,
        welcome_message: newChatbot.welcome_message,
        personality: newChatbot.personality,
        theme: {
          primaryColor: "#3B82F6",
          backgroundColor: "#FFFFFF",
          textColor: "#1F2937",
        },
        data_source_ids: newChatbot.selectedDataSources,
      })

      setIsCreateDialogOpen(false)
      setNewChatbot({
        name: "",
        description: "",
        type: ChatbotType.PUBLIC,
        welcome_message: "Hello! How can I help you today?",
        personality: ChatbotPersonality.PROFESSIONAL,
        selectedDataSources: [],
      })
    } catch (error) {
      console.error('Failed to create chatbot:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const toggleChatbotStatus = async (id: string, currentStatus: boolean) => {
    setTogglingChatbotId(id)
    try {
      await toggleStatus(id, currentStatus)
    } finally {
      setTogglingChatbotId(null)
    }
  }

  const handleDeleteChatbot = async (id: string) => {
    await deleteChatbotApi(id)
  }

  const handleDataSourceToggle = (dataSourceId: string, checked: boolean) => {
    if (checked) {
      setNewChatbot((prev) => ({
        ...prev,
        selectedDataSources: [...prev.selectedDataSources, dataSourceId],
      }))
    } else {
      setNewChatbot((prev) => ({
        ...prev,
        selectedDataSources: prev.selectedDataSources.filter((id) => id !== dataSourceId),
      }))
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chatbots</h2>
          <p className="text-muted-foreground">Create and manage your AI chatbots</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => mutate()}
            disabled={isLoading}
            className="hover:bg-primary/10 hover:text-primary transition-all duration-300"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Chatbot
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Chatbot</DialogTitle>
              <DialogDescription>Configure your chatbot settings and select data sources</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newChatbot.name}
                  onChange={(e) => setNewChatbot((prev) => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                  placeholder="Customer Support Bot"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newChatbot.description}
                  onChange={(e) => setNewChatbot((prev) => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                  placeholder="Handles customer inquiries and support requests"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Chatbot Type
                </Label>
                <Select
                  value={newChatbot.type}
                  onValueChange={(value: ChatbotType) => setNewChatbot((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ChatbotType.PUBLIC}>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Public - Website embedding, open access</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={ChatbotType.INTERNAL}>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Internal - Staff only, authentication required</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="welcome" className="text-right">
                  Welcome Message
                </Label>
                <Textarea
                  id="welcome"
                  value={newChatbot.welcome_message}
                  onChange={(e) => setNewChatbot((prev) => ({ ...prev, welcome_message: e.target.value }))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="personality" className="text-right">
                  Personality
                </Label>
                <Select
                  value={newChatbot.personality}
                  onValueChange={(value: ChatbotPersonality) => setNewChatbot((prev) => ({ ...prev, personality: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ChatbotPersonality.PROFESSIONAL}>Professional</SelectItem>
                    <SelectItem value={ChatbotPersonality.FRIENDLY}>Friendly</SelectItem>
                    <SelectItem value={ChatbotPersonality.CASUAL}>Casual</SelectItem>
                    <SelectItem value={ChatbotPersonality.TECHNICAL}>Technical</SelectItem>
                    <SelectItem value={ChatbotPersonality.FORMAL}>Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right mt-2">Data Sources</Label>
                <div className="col-span-3 space-y-2">
                  {!dataSources || dataSources.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data sources available. Upload some data first.</p>
                  ) : (
                    dataSources.map((dataSource) => (
                      <div key={dataSource.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={dataSource.id}
                          checked={newChatbot.selectedDataSources.includes(dataSource.id)}
                          onCheckedChange={(checked) => handleDataSourceToggle(dataSource.id, checked as boolean)}
                        />
                        <Label htmlFor={dataSource.id} className="text-sm">
                          {dataSource.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleCreateChatbot} 
                disabled={!newChatbot.name || !newChatbot.description || isCreating}
              >
                {isCreating ? "Creating..." : "Create Chatbot"}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading chatbots...</div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="relative mb-6">
            <div className="relative p-6 bg-destructive/10 rounded-full inline-flex">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold mb-2 text-destructive">Error loading chatbots</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => mutate()}>Try Again</Button>
        </div>
      ) : !chatbots || chatbots.length === 0 ? (
        <AnimatedCard className="p-12" glow>
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
              <div className="relative p-6 bg-primary/10 rounded-full inline-flex">
                <Bot className="h-16 w-16 text-primary" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold">No chatbots yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Create your first AI chatbot to start helping your customers with automated support
              </p>
            </div>
            <GradientButton onClick={() => setIsCreateDialogOpen(true)} className="group">
              <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              Create Your First Chatbot
            </GradientButton>
          </div>
        </AnimatedCard>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {chatbots.map((chatbot, index) => (
            <AnimatedCard
              key={chatbot.id}
              className="p-6 group animate-in slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: `${index * 150}ms` }}
              glow
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors duration-300">
                      <Bot className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{chatbot.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={chatbot.is_active ? "default" : "secondary"}
                          className="transition-all duration-300 hover:scale-105"
                        >
                          {chatbot.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge
                          variant={chatbot.type === "public" ? "outline" : "destructive"}
                          className="transition-all duration-300 hover:scale-105"
                        >
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${chatbot.type === "public" ? "bg-green-500" : "bg-blue-500"}`}></div>
                            {chatbot.type === "public" ? "Public" : "Internal"}
                          </div>
                        </Badge>
                        <Badge
                          variant={
                            chatbot.status === "ready" ? "default" : 
                            chatbot.status === "processing" ? "secondary" : 
                            "destructive"
                          }
                          className="transition-all duration-300 hover:scale-105"
                        >
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${
                              chatbot.status === "ready" ? "bg-green-500" : 
                              chatbot.status === "processing" ? "bg-yellow-500" : 
                              "bg-red-500"
                            }`}></div>
                            {chatbot.status === "ready" ? "Ready" : 
                             chatbot.status === "processing" ? "Training" : 
                             "Error"}
                          </div>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed">{chatbot.description}</p>

                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Welcome Message:</p>
                    <p className="text-sm italic">"{chatbot.welcome_message || 'Hello! How can I help you today?'}"</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Personality:</p>
                      <Badge variant="outline" className="capitalize mt-1">
                        {chatbot.personality}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">Data Sources:</p>
                      <p className="text-lg font-semibold text-primary">{(chatbot as any)?.dataSourceCount ?? 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleChatbotStatus(chatbot.id, chatbot.is_active)}
                      disabled={togglingChatbotId === chatbot.id}
                      className="hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-105"
                    >
                      {togglingChatbotId === chatbot.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : chatbot.is_active ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Link href={`/chat?chatbotId=${chatbot.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-green-500/10 hover:text-green-600 transition-all duration-300 hover:scale-105 bg-transparent"
                        title={`Open ${chatbot.type} chat interface`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/chatbots/integrations/${chatbot.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-purple-500/10 hover:text-purple-600 transition-all duration-300 hover:scale-105 bg-transparent"
                        title="Manage integrations"
                      >
                        <Plug className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteChatbot(chatbot.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-300 hover:scale-105"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  )
} 