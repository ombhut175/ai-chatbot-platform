import useSWR from 'swr'
import { useAuthStore } from '@/lib/store'
import { apiRequest } from '@/helpers/request'

export interface DashboardStats {
  totalChatbots: number
  totalDataSources: number
  messagesToday: number
  activeChats: number
}

export interface DashboardActivity {
  id: string
  action: string
  description: string
  time: string
  type: 'success' | 'info' | 'error'
  icon: string
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  const { userProfile } = useAuthStore()
  const companyId = userProfile?.company_id

  const { data, error, isLoading, mutate } = useSWR(
    companyId ? '/api/dashboard/stats' : null,
    async () => {
      console.log('📊 Fetching dashboard stats for company:', companyId)
      const result = await apiRequest.get<DashboardStats>('/api/dashboard/stats')
      console.log('📊 Dashboard stats result:', result)
      return result
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds for live stats
      dedupingInterval: 5000,
      onError: (error) => {
        console.error('❌ Dashboard stats error:', error)
      }
    }
  )

  console.log('📊 Dashboard stats hook state:', { 
    companyId, 
    hasData: !!data, 
    isLoading, 
    hasError: !!error,
    userProfile: userProfile ? 'present' : 'missing'
  })

  return {
    stats: data,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook to fetch dashboard recent activity
 */
export function useDashboardActivity() {
  const { userProfile } = useAuthStore()
  const companyId = userProfile?.company_id

  const { data, error, isLoading, mutate } = useSWR(
    companyId ? '/api/dashboard/activity' : null,
    async () => {
      console.log('📱 Fetching dashboard activity for company:', companyId)
      const result = await apiRequest.get<DashboardActivity[]>('/api/dashboard/activity')
      console.log('📱 Dashboard activity result:', result)
      return result
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Refresh every minute for activity updates
      dedupingInterval: 10000,
      onError: (error) => {
        console.error('❌ Dashboard activity error:', error)
      }
    }
  )

  console.log('📱 Dashboard activity hook state:', { 
    companyId, 
    hasData: !!data, 
    dataLength: data?.length || 0, 
    isLoading, 
    hasError: !!error
  })

  return {
    activities: data || [],
    isLoading,
    error,
    mutate,
  }
}

/**
 * Combined hook for all dashboard data
 */
export function useDashboardData() {
  const stats = useDashboardStats()
  const activity = useDashboardActivity()

  return {
    stats: stats.stats,
    activities: activity.activities,
    isLoading: stats.isLoading || activity.isLoading,
    error: stats.error || activity.error,
    mutate: () => {
      stats.mutate()
      activity.mutate()
    }
  }
}
