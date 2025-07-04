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
  description: string | null
  type: "public" | "internal"
  welcome_message: string | null
  personality: "professional" | "friendly" | "casual" | "technical" | "formal"
  theme: any | null
  is_active: boolean
  status: "processing" | "ready" | "error"
  company_id: string
  pinecone_namespace: string | null
  created_at: string
  updated_at: string
  dataSources?: string[] // Optional field for UI compatibility
  dataSourceCount?: number // Count of associated data sources
}

export interface ChatMessage {
  id: string
  session_id: string
  message: string
  response?: string | null
  message_type: "user" | "assistant"
  tokens_used?: number | null
  response_time_ms?: number | null
  created_at: string
  chatbot_id?: string
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
