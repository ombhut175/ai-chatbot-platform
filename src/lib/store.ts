import { create } from "zustand"
import type { User, Chatbot, DataSource } from "./types"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  supabaseUser: SupabaseUser | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (user: User) => void
  logout: () => void
  setSupabaseUser: (user: SupabaseUser | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
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
  user: null,
  supabaseUser: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, supabaseUser: null, isAuthenticated: false, error: null }),
  setSupabaseUser: (supabaseUser) => set({ supabaseUser, isAuthenticated: !!supabaseUser }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))

export const useAppStore = create<AppState>((set) => ({
  chatbots: [],
  dataSources: [],
  selectedChatbot: null,
  setChatbots: (chatbots) => set({ chatbots }),
  setDataSources: (dataSources) => set({ dataSources }),
  setSelectedChatbot: (selectedChatbot) => set({ selectedChatbot }),
}))
