"use client"

import type * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bot, Database, Home, Settings, User, ChevronUp, Sparkles, Users } from "lucide-react"
import { AppRoute } from "@/helpers/string_const/routes"
import { createClient } from "@/lib/supabase/client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuthStore } from "@/lib/store"

const getNavItems = (isOwner: boolean, userRole: string | undefined) => [
  {
    title: "Dashboard",
    url: AppRoute.DASHBOARD,
    icon: Home,
  },
  ...(userRole !== "visitor" ? [
    {
      title: "Data Sources",
      url: AppRoute.DASHBOARD_DATA,
      icon: Database,
    },
    {
      title: "Chatbots",
      url: AppRoute.DASHBOARD_CHATBOTS,
      icon: Bot,
    },
  ] : []),
  ...(isOwner ? [{
    title: "Users",
    url: AppRoute.DASHBOARD_USERS,
    icon: Users,
  }] : []),
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { userProfile, isOwner, supabaseUser, initializing } = useAuthStore()
  const supabase = createClient()
  const router = useRouter()
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  
  // Show loading state while profile is being fetched
  const isLoading = initializing || (supabaseUser && !userProfile)
  
  const navItems = getNavItems(isOwner(), userProfile?.role)

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/50 backdrop-blur-xl" {...props}>
      <SidebarHeader className="border-b border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="group">
              <Link href="/dashboard" className="transition-all duration-300 hover:bg-primary/10">
                <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg group-hover:shadow-xl group-hover:shadow-primary/25 transition-all duration-300 group-hover:scale-110">
                  <Sparkles className="size-4 group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {isLoading ? (
                      <span className="inline-block h-4 w-24 animate-pulse bg-muted rounded"></span>
                    ) : (
                      userProfile?.company?.name || "Your Company"
                    )}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {isLoading ? (
                      "Loading..."
                    ) : (
                      "Free Plan"
                    )}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/70">Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                    className="group transition-all duration-300 hover:bg-primary/10 data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                      <span className="transition-colors duration-300">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group transition-all duration-300 hover:bg-primary/10"
                >
                <Avatar className="h-8 w-8 rounded-lg transition-all duration-300 group-hover:scale-110">
                    <AvatarImage 
                      src="" 
                      alt={userProfile?.name || supabaseUser?.email || "User"} 
                    />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
                      {userProfile?.name?.charAt(0) || supabaseUser?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {isLoading ? (
                        <span className="inline-block h-4 w-20 animate-pulse bg-muted rounded"></span>
                      ) : (
                        userProfile?.name || supabaseUser?.email?.split('@')[0] || "User"
                      )}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {isLoading ? (
                        "Loading..."
                      ) : (
                        userProfile?.email || supabaseUser?.email || "Loading..."
                      )}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4 transition-transform duration-300 group-hover:scale-110" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg animate-in slide-in-from-bottom-2 duration-300"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem className="cursor-pointer transition-colors duration-200 hover:bg-primary/10">
                  <Link href="/dashboard/profile" className="flex items-center w-full">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
                >
                  <span className="mr-2 h-4 w-4">🚪</span>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
