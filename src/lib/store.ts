import { create } from "zustand"
import type { User, Chatbot, DataSource, Company } from "./types"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  email: string
  name: string | null
  role: "owner" | "admin" | "employee" | "visitor"
  company_id: string | null
  company?: Company | null
  created_at: string
}

interface AuthState {
  userProfile: UserProfile | null
  supabaseUser: SupabaseUser | null
  isAuthenticated: boolean
  loading: boolean
  initializing: boolean
  error: string | null
  setUserProfile: (profile: UserProfile | null) => void
  setSupabaseUser: (user: SupabaseUser | null) => void
  setLoading: (loading: boolean) => void
  setInitializing: (initializing: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  isOwner: () => boolean
}

interface AppState {
  chatbots: Chatbot[]
  dataSources: DataSource[]
  selectedChatbot: Chatbot | null
  setChatbots: (chatbots: Chatbot[]) => void
  setDataSources: (dataSources: DataSource[]) => void
  setSelectedChatbot: (chatbot: Chatbot | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  userProfile: null,
  supabaseUser: null,
  isAuthenticated: false,
  loading: false,
  initializing: false,
  error: null,
  setUserProfile: (profile) => set({ userProfile: profile }),
  setSupabaseUser: (supabaseUser) => set({ supabaseUser, isAuthenticated: !!supabaseUser }),
  setLoading: (loading) => set({ loading }),
  setInitializing: (initializing) => set({ initializing }),
  setError: (error) => set({ error }),
  logout: () => set({ userProfile: null, supabaseUser: null, isAuthenticated: false, error: null }),
  isOwner: () => {
    const userProfile = useAuthStore.getState().userProfile
    return userProfile?.role === "owner"
  },
}))

export const useAppStore = create<AppState>((set) => ({
  chatbots: [],
  dataSources: [],
  selectedChatbot: null,
  setChatbots: (chatbots) => set({ chatbots }),
  setDataSources: (dataSources) => set({ dataSources }),
  setSelectedChatbot: (selectedChatbot) => set({ selectedChatbot }),
}))
