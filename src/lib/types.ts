export interface User {
  id: string
  email: string
  name: string
  company: Company
}

export interface Company {
  id: string
  name: string
  logo?: string
  plan: "free" | "pro" | "enterprise"
  createdAt: string
}

export interface DataSource {
  id: string
  name: string
  type: "pdf" | "csv" | "xlsx" | "docx" | "json" | "text" | "url"
  size: number
  status: "processing" | "ready" | "error"
  uploadedAt: string
  companyId: string
}

export interface Chatbot {
  id: string
  name: string
  description: string
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
