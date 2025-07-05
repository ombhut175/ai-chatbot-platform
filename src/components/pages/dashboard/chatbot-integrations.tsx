"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Copy, RefreshCw, Eye, ArrowLeft, Loader2, ExternalLink, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useChatbot } from "@/hooks/use-chatbots"
import { AnimatedCard } from "@/components/ui/animated-card"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Type declaration for the widget API
declare global {
  interface Window {
    ChatbotWidget?: {
      _initialized: boolean
      config: any
      open: () => void
      close: () => void
      toggle: () => void
      destroy: () => void
      isOpen: () => boolean
    }
  }
}

export default function ChatbotIntegrationsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const chatbotId = params?.chatbotId as string
  
  // Fetch chatbot data
  const { chatbot, isLoading, error } = useChatbot(chatbotId)
  
  const [widgetSettings, setWidgetSettings] = useState({
    position: "bottom-right",
    size: "medium",
    theme: "light",
  })
  const [apiKey] = useState("YOUR_API_KEY_HERE") // TODO: Fetch from backend
  const [showIframePreview, setShowIframePreview] = useState(false)
  const [showWidgetPreview, setShowWidgetPreview] = useState(false)
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any widget instances if they exist
      if (typeof window !== 'undefined' && window.ChatbotWidget) {
        window.ChatbotWidget.destroy?.()
      }
    }
  }, [])

  const generateWidgetCode = useMemo(() => {
    if (!chatbotId) return ""

    // Validate and sanitize the app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const sanitizedChatbotId = chatbotId.replace(/[^a-zA-Z0-9-_]/g, '')
    
    // Escape values for HTML attributes
    const escapeHtml = (str: string) => {
      const div = document.createElement('div')
      div.textContent = str
      return div.innerHTML
    }

    return `<!-- AI Chatbot Widget -->
<script 
  src="${escapeHtml(appUrl)}/widget.js" 
  data-chatbot-id="${escapeHtml(sanitizedChatbotId)}"
  data-position="${escapeHtml(widgetSettings.position)}"
  data-size="${escapeHtml(widgetSettings.size)}"
  data-theme="${escapeHtml(widgetSettings.theme)}"
  defer>
</script>`
  }, [chatbotId, widgetSettings.position, widgetSettings.size, widgetSettings.theme])

  const generateIframeCode = useMemo(() => {
    if (!chatbotId) return ""

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const sanitizedChatbotId = chatbotId.replace(/[^a-zA-Z0-9-_]/g, '')
    
    // Escape values for HTML attributes
    const escapeHtml = (str: string) => {
      const div = document.createElement('div')
      div.textContent = str
      return div.innerHTML
    }
    
    return `<iframe
  src="${escapeHtml(appUrl)}/chat?chatbotId=${escapeHtml(sanitizedChatbotId)}"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
></iframe>`
  }, [chatbotId])

  const generateApiExample = useMemo(() => {
    const sanitizedChatbotId = chatbotId?.replace(/[^a-zA-Z0-9-_]/g, '') || 'YOUR_CHATBOT_ID'
    const displayApiKey = isApiKeyVisible ? apiKey : 'YOUR_API_KEY_HERE'
    
    return `curl -X POST https://api.yourplatform.com/v1/chat \\
  -H "Authorization: Bearer ${displayApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "chatbot_id": "${sanitizedChatbotId}",
    "message": "Hello, how can you help me?",
    "session_id": "user-session-123"
  }'`
  }, [chatbotId, isApiKeyVisible, apiKey])

  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${type} code copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try selecting and copying the text manually",
        variant: "destructive",
      })
    }
  }, [toast])

  const regenerateApiKey = useCallback(() => {
    // TODO: Implement actual API key regeneration
    toast({
      title: "Feature Coming Soon",
      description: "API key regeneration will be available in the next update",
      variant: "default",
    })
  }, [toast])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading chatbot data...</p>
        </div>
      </div>
    )
  }

  if (error || !chatbot) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-12">
          <h3 className="text-2xl font-semibold mb-2">Chatbot not found</h3>
          <p className="text-muted-foreground mb-6">The chatbot you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/dashboard/chatbots')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chatbots
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/dashboard/chatbots')}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Integrations for {chatbot.name}</h2>
          <p className="text-muted-foreground">Embed your chatbot and integrate with your applications</p>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatedCard>
          <CardHeader>
            <CardTitle>Chatbot Details</CardTitle>
            <CardDescription>Information about the selected chatbot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="font-semibold">{chatbot.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <Badge variant={chatbot.type === "public" ? "default" : "secondary"}>
                  {chatbot.type}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={chatbot.is_active ? "default" : "destructive"}>
                  {chatbot.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Personality</p>
                <Badge variant="outline" className="capitalize">
                  {chatbot.personality}
                </Badge>
              </div>
            </div>
          </CardContent>
        </AnimatedCard>

        <Tabs defaultValue="widget" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="widget">JavaScript Widget</TabsTrigger>
            <TabsTrigger value="iframe">iFrame Embed</TabsTrigger>
            <TabsTrigger value="api">API Access</TabsTrigger>
          </TabsList>

          <TabsContent value="widget" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <AnimatedCard>
                <CardHeader>
                  <CardTitle>Widget Settings</CardTitle>
                  <CardDescription>Customize your chat widget appearance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Select
                      value={widgetSettings.position}
                      onValueChange={(value) => setWidgetSettings((prev) => ({ ...prev, position: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Select
                      value={widgetSettings.size}
                      onValueChange={(value) => setWidgetSettings((prev) => ({ ...prev, size: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={widgetSettings.theme}
                      onValueChange={(value) => setWidgetSettings((prev) => ({ ...prev, theme: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full" onClick={() => setShowWidgetPreview(true)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Widget
                  </Button>
                </CardContent>
              </AnimatedCard>

              <AnimatedCard>
                <CardHeader>
                  <CardTitle>Installation Code</CardTitle>
                  <CardDescription>Copy this code to your website</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea value={generateWidgetCode} readOnly rows={12} className="font-mono text-sm" />
                    <Button onClick={() => copyToClipboard(generateWidgetCode, "Widget")} className="w-full">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Code
                    </Button>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">💡 Tip:</p>
                    <p className="text-sm text-muted-foreground">
                      You can test the widget on our <a href="/widget-test.html" target="_blank" className="text-primary hover:underline">widget test page</a> before adding it to your website.
                    </p>
                  </div>
                </CardContent>
              </AnimatedCard>
            </div>
          </TabsContent>

          <TabsContent value="iframe" className="space-y-4">
            <AnimatedCard>
              <CardHeader>
                <CardTitle>iFrame Embed</CardTitle>
                <CardDescription>
                  Embed the chatbot directly in your webpage. The chatbot will be accessible from any domain.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Generated HTML Snippet</Label>
                  <p className="text-sm text-muted-foreground">
                    Copy and paste this code into your HTML where you want the chatbot to appear.
                  </p>
                </div>
                <Textarea value={generateIframeCode} readOnly rows={8} className="font-mono text-sm" />
                <div className="flex gap-2">
                  <Button onClick={() => copyToClipboard(generateIframeCode, "iFrame")} className="flex-1">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy iFrame Code
                  </Button>
                  <Button variant="outline" onClick={() => setShowIframePreview(true)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Note:</p>
                  <p className="text-sm text-muted-foreground">
                    This iframe will work on any website. Make sure your chatbot is set to "public" 
                    if you want it to be accessible without authentication.
                  </p>
                </div>
              </CardContent>
            </AnimatedCard>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <div className="space-y-4">
              <AnimatedCard>
                <CardHeader>
                  <CardTitle>API Key</CardTitle>
                  <CardDescription>Use this key to authenticate API requests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <input
                      type={isApiKeyVisible ? "text" : "password"}
                      value={apiKey}
                      readOnly
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                      title={isApiKeyVisible ? "Hide API Key" : "Show API Key"}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => copyToClipboard(apiKey, "API Key")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={regenerateApiKey}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Keep your API key secure and don't share it publicly
                  </p>
                </CardContent>
              </AnimatedCard>

              <AnimatedCard>
                <CardHeader>
                  <CardTitle>API Example</CardTitle>
                  <CardDescription>Example cURL request to send a message</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea value={generateApiExample} readOnly rows={8} className="font-mono text-sm" />
                  <Button onClick={() => copyToClipboard(generateApiExample, "API Example")} className="w-full">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy API Example
                  </Button>
                </CardContent>
              </AnimatedCard>

              <AnimatedCard>
                <CardHeader>
                  <CardTitle>API Documentation</CardTitle>
                  <CardDescription>Available endpoints and parameters</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge>POST</Badge>
                        <code className="text-sm">/v1/chat</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Send a message to the chatbot and receive a response
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="secondary">GET</Badge>
                        <code className="text-sm">/v1/chatbots/{chatbotId}</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Get details about a specific chatbot</p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="secondary">GET</Badge>
                        <code className="text-sm">/v1/conversations</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Retrieve conversation history and analytics</p>
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* iFrame Preview Dialog */}
      <Dialog open={showIframePreview} onOpenChange={setShowIframePreview}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>iFrame Preview</DialogTitle>
            <DialogDescription>
              This is how your chatbot will appear when embedded in another website.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 border rounded-lg overflow-hidden bg-muted/50">
            <div className="p-4 bg-muted border-b">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Example Website Preview</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
                    window.open(`${appUrl}/chat?chatbotId=${chatbotId}`, '_blank')
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
            <div className="p-8 h-full">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold mb-4">Your Website Content</h3>
                <p className="text-muted-foreground mb-6">
                  This is example content from your website. The chatbot iframe will appear below.
                </p>
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground text-center">
                    The chatbot will be embedded here:
                  </p>
                </div>
                {/* Actual iframe */}
                <div className="flex justify-center">
                  <iframe
                    src={`${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/chat?chatbotId=${chatbotId}`}
                    width="400"
                    height="600"
                    frameBorder={0}
                    style={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    title="Chatbot Preview"
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Widget Preview Dialog */}
      <Dialog open={showWidgetPreview} onOpenChange={setShowWidgetPreview}>
        <DialogContent className="max-w-6xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Widget Preview</DialogTitle>
            <DialogDescription>
              This is how your chatbot widget will appear on your website. The widget button will appear in the {widgetSettings.position.replace('-', ' ')} corner.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 border rounded-lg overflow-hidden bg-muted/50">
            <div className="p-4 bg-muted border-b">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Website Preview with Widget</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Position: {widgetSettings.position}</Badge>
                  <Badge variant="outline">Size: {widgetSettings.size}</Badge>
                  <Badge variant="outline">Theme: {widgetSettings.theme}</Badge>
                </div>
              </div>
            </div>
            <div className="relative h-[calc(100%-60px)] bg-white">
              {/* Simulated website content */}
              <div className="p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                  <h1 className="text-3xl font-bold text-gray-900">Welcome to Your Website</h1>
                  <p className="text-gray-600 leading-relaxed">
                    This is a preview of how your website would look with the chatbot widget installed. 
                    The widget button will appear in the corner of the page, and users can click it to open the chat interface.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-100 p-6 rounded-lg">
                      <h3 className="font-semibold mb-2">Feature 1</h3>
                      <p className="text-sm text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                    </div>
                    <div className="bg-gray-100 p-6 rounded-lg">
                      <h3 className="font-semibold mb-2">Feature 2</h3>
                      <p className="text-sm text-gray-600">Sed do eiusmod tempor incididunt ut labore et dolore magna.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Embed the actual widget */}
              <iframe
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <meta http-equiv="Content-Security-Policy" content="default-src 'self' ${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}; script-src 'self' ${process.env.NEXT_PUBLIC_APP_URL || window.location.origin} 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
                      <style>
                        body { margin: 0; padding: 0; position: relative; min-height: 100vh; }
                      </style>
                    </head>
                    <body>
                      ${generateWidgetCode.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&lt;script/g, '<script').replace(/script&gt;/g, 'script>')}
                    </body>
                  </html>
                `}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ pointerEvents: 'all' }}
                title="Widget Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
