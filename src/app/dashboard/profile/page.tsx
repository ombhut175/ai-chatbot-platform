"use client"

import { useState } from "react"
import { User, Mail, Building, Calendar, Shield, Bell, Key, Smartphone } from "lucide-react"

import { AnimatedCard } from "@/components/ui/animated-card"
import { FloatingLabelInput } from "@/components/ui/floating-label-input"
import { GradientButton } from "@/components/ui/gradient-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuthStore } from "@/lib/store"

export default function ProfilePage() {
  const { userProfile } = useAuthStore()
  const { toast } = useToast()

  const [profileData, setProfileData] = useState({
    name: userProfile?.name || "",
    email: userProfile?.email || "",
    phone: "+1 (555) 123-4567",
    company: userProfile?.company?.name || "",
    role: "Administrator",
    timezone: "UTC-8 (Pacific Time)",
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    marketing: false,
  })

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: "30",
    loginAlerts: true,
  })

  const handleSave = () => {
    toast({
      title: "Profile updated",
      description: "Your profile has been saved successfully.",
    })
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Profile Settings 👤
          </h2>
          <p className="text-lg text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile Overview */}
        <AnimatedCard className="p-6 md:col-span-1" glow>
          <div className="text-center space-y-6">
            <div className="relative">
              <Avatar className="h-24 w-24 mx-auto ring-4 ring-primary/20 transition-all duration-300 hover:ring-primary/40">
                <AvatarImage src="/placeholder.svg" alt={userProfile?.name || "User"} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
                  {userProfile?.name?.charAt(0) || userProfile?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 p-2 bg-primary rounded-full text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{userProfile?.name || "User Name"}</h3>
              <p className="text-muted-foreground">{userProfile?.email || "user@example.com"}</p>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                Free Plan
              </Badge>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span>Jan 2024</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last login</span>
                <span>2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-600">Active</span>
                </div>
              </div>
            </div>

            <GradientButton className="w-full">
              <User className="mr-2 h-4 w-4" />
              Upload Photo
            </GradientButton>
          </div>
        </AnimatedCard>

        {/* Profile Settings */}
        <div className="md:col-span-2">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <AnimatedCard className="p-6" glow>
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">General Information</h3>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FloatingLabelInput
                      label="Full Name"
                      value={profileData.name}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                      icon={<User className="h-4 w-4" />}
                    />

                    <FloatingLabelInput
                      label="Email Address"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                      icon={<Mail className="h-4 w-4" />}
                    />

                    <FloatingLabelInput
                      label="Phone Number"
                      value={profileData.phone}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                      icon={<Smartphone className="h-4 w-4" />}
                    />

                    <FloatingLabelInput
                      label="Company"
                      value={profileData.company}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, company: e.target.value }))}
                      icon={<Building className="h-4 w-4" />}
                    />
                  </div>

                  <div className="flex justify-end">
                    <GradientButton onClick={handleSave}>Save Changes</GradientButton>
                  </div>
                </div>
              </AnimatedCard>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <AnimatedCard className="p-6" glow>
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Notification Preferences</h3>

                  <div className="space-y-6">
                    {[
                      { key: "email", label: "Email Notifications", description: "Receive updates via email" },
                      { key: "push", label: "Push Notifications", description: "Browser push notifications" },
                      { key: "sms", label: "SMS Notifications", description: "Text message alerts" },
                      { key: "marketing", label: "Marketing Emails", description: "Product updates and tips" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Bell className="h-4 w-4 text-primary" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch
                          checked={notifications[item.key as keyof typeof notifications]}
                          onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [item.key]: checked }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedCard>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <AnimatedCard className="p-6" glow>
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Security Settings</h3>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="font-medium">Two-Factor Authentication</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Switch
                        checked={security.twoFactor}
                        onCheckedChange={(checked) => setSecurity((prev) => ({ ...prev, twoFactor: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Key className="h-4 w-4 text-primary" />
                          <span className="font-medium">Login Alerts</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Get notified of new logins</p>
                      </div>
                      <Switch
                        checked={security.loginAlerts}
                        onCheckedChange={(checked) => setSecurity((prev) => ({ ...prev, loginAlerts: checked }))}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <GradientButton variant="destructive">Change Password</GradientButton>
                  </div>
                </div>
              </AnimatedCard>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <AnimatedCard className="p-6" glow>
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Billing & Subscription</h3>
                  <p className="text-muted-foreground mb-6">Manage your subscription and billing information</p>
                  <GradientButton>View Billing Details</GradientButton>
                </div>
              </AnimatedCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
