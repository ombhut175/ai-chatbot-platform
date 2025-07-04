import type { User, Company, Chatbot, DataSource, DashboardStats } from "./types"

export const mockCompany: Company = {
  id: "1",
  name: "Acme Corporation",
  logo: "/placeholder.svg?height=40&width=40",
  createdAt: "2024-01-15T10:00:00Z",
}

export const mockUser: User = {
  id: "1",
  email: "john@acme.com",
  name: "John Smith",
  role: "owner",
  company: mockCompany,
}

export const mockDataSources: DataSource[] = [
  {
    id: "1",
    name: "Product Documentation.pdf",
    type: "pdf",
    size: 2048000,
    status: "ready",
    uploadedAt: "2024-01-20T14:30:00Z",
    companyId: "1",
  },
  {
    id: "2",
    name: "FAQ Database.csv",
    type: "csv",
    size: 512000,
    status: "ready",
    uploadedAt: "2024-01-19T09:15:00Z",
    companyId: "1",
  },
  {
    id: "3",
    name: "Company Policies.docx",
    type: "docx",
    size: 1024000,
    status: "processing",
    uploadedAt: "2024-01-21T16:45:00Z",
    companyId: "1",
  },
]

export const mockChatbots: Chatbot[] = [
  {
    id: "1",
    name: "Customer Support Bot",
    description: "Handles customer inquiries and support requests",
    type: "public",
    welcome_message: "Hello! How can I help you today?",
    personality: "professional",
    theme: {
      primaryColor: "#3B82F6",
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937",
    },
    is_active: true,
    status: "ready",
    company_id: "1",
    created_at: "2024-01-18T12:00:00Z",
    updated_at: "2024-01-18T12:00:00Z",
  },
  {
    id: "2",
    name: "HR Assistant",
    description: "Helps employees with HR-related questions",
    type: "internal",
    welcome_message: "Hi there! I'm here to help with HR questions.",
    personality: "friendly",
    theme: {
      primaryColor: "#10B981",
      backgroundColor: "#F9FAFB",
      textColor: "#374151",
    },
    is_active: false,
    status: "processing",
    company_id: "1",
    created_at: "2024-01-19T15:30:00Z",
    updated_at: "2024-01-19T15:30:00Z",
  },
]

export const mockDashboardStats: DashboardStats = {
  totalChatbots: 2,
  totalDataSources: 3,
  messagesToday: 47,
  activeChats: 3,
}
