"use client"

import { useState, useEffect } from "react"
import { Upload, Save, Key, RefreshCw, Building, User, Mail, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/store"

export default function SettingsPage() {
  const { userProfile } = useAuthStore()
  const { toast } = useToast()

  const [companySettings, setCompanySettings] = useState({
    name: "",
    logo: "",
  })

  const [accountSettings, setAccountSettings] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [chatbotDefaults, setChatbotDefaults] = useState({
    welcomeMessage: "Hello! How can I help you today?",
    fallbackMessage: "I'm sorry, I don't understand. Could you please rephrase your question?",
    offlineMessage: "We're currently offline. Please leave a message and we'll get back to you.",
  })

  useEffect(() => {
    if (userProfile) {
      setCompanySettings({
        name: userProfile.company?.name || "",
        logo: userProfile.company?.logo || "",
      })
      setAccountSettings(prev => ({
        ...prev,
        name: userProfile.name || "",
        email: userProfile.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    }
  }, [userProfile])

  const [apiKeys] = useState([
    { id: "1", name: "Production API Key", key: "sk-prod-1234567890abcdef", created: "2024-01-15" },
    { id: "2", name: "Development API Key", key: "sk-dev-abcdef1234567890", created: "2024-01-20" },
  ])

  const handleCompanyUpdate = () => {
    toast({
      title: "Company settings updated",
      description: "Your company information has been saved successfully.",
    })
  }

  const handleAccountUpdate = () => {
    if (accountSettings.newPassword && accountSettings.newPassword !== accountSettings.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Account updated",
      description: "Your account settings have been saved successfully.",
    })
  }

  const handleChatbotDefaultsUpdate = () => {
    toast({
      title: "Chatbot defaults updated",
      description: "Default chatbot settings have been saved successfully.",
    })
  }

  const regenerateApiKey = (keyId: string) => {
    toast({
      title: "API Key regenerated",
      description: "A new API key has been generated. Update your applications accordingly.",
    })
  }

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your account and application settings</p>
        </div>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="chatbots">Chatbot Defaults</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>Update your company information and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={companySettings.logo || "/placeholder.svg"} alt="Company logo" />
                  <AvatarFallback>
                    <Building className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">Recommended: 200x200px, PNG or JPG</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={companySettings.name}
                  onChange={(e) => setCompanySettings((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <Button onClick={handleCompanyUpdate}>
                <Save className="mr-2 h-4 w-4" />
                Save Company Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="full-name"
                    value={accountSettings.name}
                    onChange={(e) => setAccountSettings((prev) => ({ ...prev, name: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={accountSettings.email}
                    onChange={(e) => setAccountSettings((prev) => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button onClick={handleAccountUpdate}>
                <Save className="mr-2 h-4 w-4" />
                Save Account Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="current-password"
                    type="password"
                    value={accountSettings.currentPassword}
                    onChange={(e) => setAccountSettings((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="new-password"
                    type="password"
                    value={accountSettings.newPassword}
                    onChange={(e) => setAccountSettings((prev) => ({ ...prev, newPassword: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    value={accountSettings.confirmPassword}
                    onChange={(e) => setAccountSettings((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleAccountUpdate}>
                <Save className="mr-2 h-4 w-4" />
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chatbots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chatbot Defaults</CardTitle>
              <CardDescription>Set the default messages for your chatbots</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Textarea
                  id="welcome-message"
                  value={chatbotDefaults.welcomeMessage}
                  onChange={(e) => setChatbotDefaults((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fallback-message">Fallback Message</Label>
                <Textarea
                  id="fallback-message"
                  value={chatbotDefaults.fallbackMessage}
                  onChange={(e) => setChatbotDefaults((prev) => ({ ...prev, fallbackMessage: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offline-message">Offline Message</Label>
                <Textarea
                  id="offline-message"
                  value={chatbotDefaults.offlineMessage}
                  onChange={(e) => setChatbotDefaults((prev) => ({ ...prev, offlineMessage: e.target.value }))}
                />
              </div>
              <Button onClick={handleChatbotDefaultsUpdate}>
                <Save className="mr-2 h-4 w-4" />
                Save Chatbot Defaults
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API keys for integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button>
                  <Key className="mr-2 h-4 w-4" />
                  Generate New API Key
                </Button>
              </div>
              <ul className="space-y-4">
                {apiKeys.map((key) => (
                  <li key={key.id} className="p-4 border rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{key.name}</p>
                      <p className="text-sm text-gray-500 font-mono">{key.key}</p>
                      <p className="text-xs text-gray-400 mt-1">Created: {key.created}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => copyApiKey(key.key)}>
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => regenerateApiKey(key.id)}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
