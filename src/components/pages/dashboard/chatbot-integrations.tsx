"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Copy, RefreshCw, Eye, ArrowLeft, Loader2, ExternalLink, X, Key, Trash2, Plus, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useChatbot } from "@/hooks/use-chatbots"
import { useApiKeys } from "@/hooks/use-api-keys"
import { AnimatedCard } from "@/components/ui/animated-card"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"

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
  const [showIframePreview, setShowIframePreview] = useState(false)
  const [showWidgetPreview, setShowWidgetPreview] = useState(false)
  const [showNewApiKeyModal, setShowNewApiKeyModal] = useState(false)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null)
  const [isCreatingKey, setIsCreatingKey] = useState(false)
  const [selectedApiKeyForExample, setSelectedApiKeyForExample] = useState<string>("placeholder")
  
  // Use the API keys hook
  const { apiKeys, isLoading: isLoadingKeys, error: apiKeysError, createApiKey, revokeApiKey } = useApiKeys(chatbotId)

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

  const generateApiExample = useCallback(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    
    // Use the selected API key, or the first active API key, or placeholder
    let displayApiKey = selectedApiKeyForExample
    if (!displayApiKey || displayApiKey === 'placeholder') {
      if (apiKeys.length > 0) {
        const activeKey = apiKeys.find(key => key.is_active)
        displayApiKey = activeKey ? activeKey.key_preview : 'YOUR_API_KEY'
      } else {
        displayApiKey = 'YOUR_API_KEY'
      }
    }
    
    return `curl -X POST ${appUrl}/api/chat/public \\
  -H "Authorization: Bearer ${displayApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Hello, how can you help me?",
    "sessionId": "user-session-123"
  }'`
  }, [apiKeys, selectedApiKeyForExample])

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

  const handleCreateApiKey = useCallback(async () => {
    setIsCreatingKey(true)
    setNewApiKey(null)
    
    const apiKey = await createApiKey()
    
    if (apiKey) {
      setNewApiKey(apiKey)
      setShowNewApiKeyModal(true)
      toast({
        title: "API Key Created",
        description: "Your new API key has been generated successfully.",
      })
    } else {
      toast({
        title: "Failed to create API key",
        description: apiKeysError || "Please try again later.",
        variant: "destructive",
      })
    }
    
    setIsCreatingKey(false)
  }, [createApiKey, apiKeysError, toast])
  
  const handleRevokeApiKey = useCallback(async (keyId: string) => {
    const success = await revokeApiKey(keyId)
    
    if (success) {
      toast({
        title: "API Key Revoked",
        description: "The API key has been successfully revoked.",
      })
    } else {
      toast({
        title: "Failed to revoke API key",
        description: apiKeysError || "Please try again later.",
        variant: "destructive",
      })
    }
    
    setKeyToRevoke(null)
  }, [revokeApiKey, apiKeysError, toast])

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
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage API keys for programmatic access to your chatbot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-muted-foreground">
                      {apiKeys.length === 0 ? "No API keys created yet" : `${apiKeys.length} API key${apiKeys.length === 1 ? '' : 's'} created`}
                    </p>
                    <Button onClick={handleCreateApiKey} disabled={isCreatingKey}>
                      {isCreatingKey ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Generate New API Key
                    </Button>
                  </div>
                  
                  {isLoadingKeys ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : apiKeys.length > 0 ? (
                    <div className="space-y-2">
                      {apiKeys.map((key) => (
                        <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono">{key.key_preview}</code>
                              <Badge variant={key.is_active ? "default" : "secondary"}>
                                {key.is_active ? "Active" : "Revoked"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-muted-foreground">
                                Created: {format(new Date(key.created_at), 'MMM d, yyyy HH:mm')}
                              </span>
                              {key.last_used_at && (
                                <span className="text-xs text-muted-foreground">
                                  Last used: {format(new Date(key.last_used_at), 'MMM d, yyyy HH:mm')}
                                </span>
                              )}
                            </div>
                          </div>
                          {key.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setKeyToRevoke(key.id)}
                              title="Revoke API Key"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No API keys yet. Create one to get started.</p>
                    </div>
                  )}
                  
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">⚠️ Security Note:</p>
                    <p className="text-sm text-muted-foreground">
                      Keep your API keys secure and never share them publicly. If a key is compromised, revoke it immediately.
                    </p>
                  </div>
                </CardContent>
              </AnimatedCard>

              <AnimatedCard>
                <CardHeader>
                  <CardTitle>API Example</CardTitle>
                  <CardDescription>Example cURL request to send a message</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {apiKeys.length > 0 && !isLoadingKeys && (
                    <div className="space-y-2">
                      <Label htmlFor="api-key-select">API Key for Example</Label>
                      <Select
                        value={selectedApiKeyForExample}
                        onValueChange={setSelectedApiKeyForExample}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an API key" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="placeholder">Use placeholder key</SelectItem>
                          {apiKeys
                            .filter(key => key.is_active && key.key_preview && key.key_preview.trim() !== '')
                            .map((key) => (
                              <SelectItem key={key.id} value={key.key_preview}>
                                {key.key_preview} {key.last_used_at && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    (Last used: {format(new Date(key.last_used_at), 'MMM d')})
                                  </span>
                                )}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Textarea value={generateApiExample()} readOnly rows={8} className="font-mono text-sm" />
                  <div className="flex gap-2">
                    <Button onClick={() => copyToClipboard(generateApiExample(), "API Example")} className="flex-1">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy API Example
                    </Button>
                    {apiKeys.length === 0 && (
                      <p className="text-sm text-muted-foreground self-center">
                        Create an API key to see a real example
                      </p>
                    )}
                  </div>
                  {selectedApiKeyForExample && selectedApiKeyForExample !== 'placeholder' && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        💡 This example uses your actual API key. Copy it to test with your chatbot immediately!
                      </p>
                    </div>
                  )}
                </CardContent>
              </AnimatedCard>

              <AnimatedCard>
                <CardHeader>
                  <CardTitle>API Documentation</CardTitle>
                  <CardDescription>Complete guide for using the Chat API</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Endpoint</h4>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge>POST</Badge>
                          <code className="text-sm">{process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/chat/public</code>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Send a message to the chatbot and receive a response
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Authentication</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Include your API key in the Authorization header:
                      </p>
                      <code className="text-sm bg-muted p-2 rounded block">
                        Authorization: Bearer YOUR_API_KEY
                      </code>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Request Body</h4>
                      <div className="border rounded-lg p-4">
                        <pre className="text-sm">
{`{
  "message": "string (required)",
  "sessionId": "string (optional)"
}`}
                        </pre>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Response</h4>
                      <div className="border rounded-lg p-4">
                        <pre className="text-sm">
{`{
  "success": true,
  "data": {
    "response": "string",
    "sessionId": "string",
    "timestamp": "ISO 8601 datetime"
  }
}`}
                        </pre>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Error Responses</h4>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <Badge variant="destructive" className="mr-2">401</Badge>
                          <span className="text-muted-foreground">Invalid or missing API key</span>
                        </div>
                        <div className="text-sm">
                          <Badge variant="destructive" className="mr-2">400</Badge>
                          <span className="text-muted-foreground">Invalid request body</span>
                        </div>
                        <div className="text-sm">
                          <Badge variant="destructive" className="mr-2">404</Badge>
                          <span className="text-muted-foreground">Chatbot not found or inactive</span>
                        </div>
                        <div className="text-sm">
                          <Badge variant="destructive" className="mr-2">500</Badge>
                          <span className="text-muted-foreground">Internal server error</span>
                        </div>
                      </div>
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
      
      {/* New API Key Modal */}
      <Dialog open={showNewApiKeyModal} onOpenChange={setShowNewApiKeyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New API Key Created</DialogTitle>
            <DialogDescription>
              Make sure to copy your API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <code className="text-sm font-mono break-all">{newApiKey}</code>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  if (newApiKey) {
                    copyToClipboard(newApiKey, "API Key")
                  }
                }}
                className="flex-1"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy API Key
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowNewApiKeyModal(false)
                  setNewApiKey(null)
                }}
              >
                Close
              </Button>
            </div>
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <p className="font-semibold mb-1">Important:</p>
                <p>Store this API key securely. It provides full access to your chatbot.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Revoke API Key Confirmation */}
      <AlertDialog open={!!keyToRevoke} onOpenChange={(open) => !open && setKeyToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Applications using this API key will immediately lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => keyToRevoke && handleRevokeApiKey(keyToRevoke)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
