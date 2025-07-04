export interface User {
  id: string
  email: string
  name: string
  role: "owner" | "admin" | "employee" | "visitor"
  company?: Company
  created_at?: string
  email_confirmed_at?: string
  last_sign_in_at?: string
}

export interface Invitation {
  id: string
  email: string
  companyId: string
  invitedBy: string
  role: "admin" | "employee"
  status: "pending" | "accepted" | "expired"
  token: string
  expiresAt: string
  createdAt: string
}

export interface Company {
  id: string
  name: string
  logo?: string
  createdAt: string
}

export interface DataSource {
  id: string
  name: string
  type: "pdf" | "csv" | "xlsx" | "txt" | "docx" | "json"
  size: number
  status: "processing" | "ready" | "error"
  uploadedAt: string
  companyId: string
}

export interface Chatbot {
  id: string
  name: string
  description: string
  type: "public" | "internal"
  welcomeMessage: string
  personality: "professional" | "friendly" | "casual" | "technical"
  theme: {
    primaryColor: string
    backgroundColor: string
    textColor: string
  }
  dataSources: string[]
  isActive: boolean
  createdAt: string
  companyId: string
}

export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: string
  chatbotId?: string
}

export interface Integration {
  id: string
  type: "widget" | "iframe" | "api"
  chatbotId: string
  apiKey: string
  settings: {
    position?: "bottom-right" | "bottom-left"
    size?: "small" | "medium" | "large"
    theme?: "light" | "dark"
  }
}

export interface DashboardStats {
  totalChatbots: number
  totalDataSources: number
  messagesToday: number
  activeChats: number
}
