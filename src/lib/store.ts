import { create } from "zustand"
import type { User, Chatbot, DataSource } from "./types"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
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
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))

export const useAppStore = create<AppState>((set) => ({
  chatbots: [],
  dataSources: [],
  selectedChatbot: null,
  setChatbots: (chatbots) => set({ chatbots }),
  setDataSources: (dataSources) => set({ dataSources }),
  setSelectedChatbot: (selectedChatbot) => set({ selectedChatbot }),
}))
