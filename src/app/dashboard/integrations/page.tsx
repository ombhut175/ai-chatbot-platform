"use client"

import { useState } from "react"
import { Copy, RefreshCw, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAppStore } from "@/lib/store"

export default function IntegrationsPage() {
  const { chatbots } = useAppStore()
  const { toast } = useToast()
  const [selectedChatbot, setSelectedChatbot] = useState("")
  const [widgetSettings, setWidgetSettings] = useState({
    position: "bottom-right",
    size: "medium",
    theme: "light",
  })
  const [apiKey] = useState("sk-1234567890abcdef1234567890abcdef")

  const generateWidgetCode = () => {
    if (!selectedChatbot) return ""

    return `<!-- AI Chatbot Widget -->
<script>
  (function() {
    var chatbot = document.createElement('script');
    chatbot.src = 'https://cdn.yourplatform.com/widget.js';
    chatbot.setAttribute('data-chatbot-id', '${selectedChatbot}');
    chatbot.setAttribute('data-position', '${widgetSettings.position}');
    chatbot.setAttribute('data-size', '${widgetSettings.size}');
    chatbot.setAttribute('data-theme', '${widgetSettings.theme}');
    document.head.appendChild(chatbot);
  })();
</script>`
  }

  const generateIframeCode = () => {
    if (!selectedChatbot) return ""

    return `<iframe
  src="https://chat.yourplatform.com/embed/${selectedChatbot}"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
></iframe>`
  }

  const generateApiExample = () => {
    return `curl -X POST https://api.yourplatform.com/v1/chat \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "chatbot_id": "${selectedChatbot}",
    "message": "Hello, how can you help me?",
    "session_id": "user-session-123"
  }'`
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${type} code copied to clipboard`,
    })
  }

  const regenerateApiKey = () => {
    toast({
      title: "API Key Regenerated",
      description: "Your new API key has been generated",
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
          <p className="text-muted-foreground">Embed your chatbots and integrate with your applications</p>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Chatbot</CardTitle>
            <CardDescription>Choose which chatbot you want to integrate</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedChatbot} onValueChange={setSelectedChatbot}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a chatbot" />
              </SelectTrigger>
              <SelectContent>
                {chatbots.map((chatbot) => (
                  <SelectItem key={chatbot.id} value={chatbot.id}>
                    {chatbot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedChatbot && (
          <Tabs defaultValue="widget" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="widget">JavaScript Widget</TabsTrigger>
              <TabsTrigger value="iframe">iFrame Embed</TabsTrigger>
              <TabsTrigger value="api">API Access</TabsTrigger>
            </TabsList>

            <TabsContent value="widget" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
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
                        </SelectContent>
                      </Select>
                    </div>

                    <Button className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Widget
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Installation Code</CardTitle>
                    <CardDescription>Copy this code to your website</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea value={generateWidgetCode()} readOnly rows={12} className="font-mono text-sm" />
                      <Button onClick={() => copyToClipboard(generateWidgetCode(), "Widget")} className="w-full">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="iframe" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>iFrame Embed</CardTitle>
                  <CardDescription>Embed the chatbot directly in your webpage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea value={generateIframeCode()} readOnly rows={8} className="font-mono text-sm" />
                  <Button onClick={() => copyToClipboard(generateIframeCode(), "iFrame")} className="w-full">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy iFrame Code
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>API Key</CardTitle>
                    <CardDescription>Use this key to authenticate API requests</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Input value={apiKey} readOnly className="font-mono" />
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
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>API Example</CardTitle>
                    <CardDescription>Example cURL request to send a message</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea value={generateApiExample()} readOnly rows={8} className="font-mono text-sm" />
                    <Button onClick={() => copyToClipboard(generateApiExample(), "API Example")} className="w-full">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy API Example
                    </Button>
                  </CardContent>
                </Card>

                <Card>
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
                          <code className="text-sm">/v1/chatbots</code>
                        </div>
                        <p className="text-sm text-muted-foreground">List all available chatbots for your account</p>
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
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
