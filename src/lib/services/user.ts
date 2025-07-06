import { createClient } from '@/lib/supabase/client'
import type { Company } from '@/lib/types'

export interface UserProfile {
  id: string
  email: string
  name: string | null
  role: "owner" | "admin" | "employee" | "visitor"
  company_id: string | null
  company?: Company | null
  created_at: string
}

export interface CreateUserData {
  email: string
  name?: string
  role: "admin" | "employee"
  company_id: string
}

export interface UpdateUserData {
  name?: string
  role?: "admin" | "employee"
}

export class UserService {
  private supabase = createClient()

  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      const { data: profile, error } = await this.supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          company_id,
          created_at,
          company:companies(*)
        `)
        .eq('id', user.id)
        .single()

      if (error) {
        // If user doesn't exist in users table, create them
        if (error.code === 'PGRST116') {
          console.log('User profile not found, creating new profile...')
          const { data: newProfile, error: createError } = await this.supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email!,
              name: user.user_metadata?.name || null,
              role: 'visitor',
              company_id: null
            })
            .select(`
              id,
              email,
              name,
              role,
              company_id,
              created_at,
              company:companies(*)
            `)
            .single()

          if (createError) {
            console.error('Error creating user profile:', createError)
            return null
          }

          console.log('User profile created successfully')
          return newProfile as UserProfile
        }
        
        console.error('Error fetching user profile:', error)
        return null
      }

      return profile as UserProfile
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error)
      return null
    }
  }

  async getUsersByCompany(companyId: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          company_id,
          created_at,
          company:companies(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching company users:', error)
        return []
      }

      return (data as UserProfile[]) || []
    } catch (error) {
      console.error('Error in getUsersByCompany:', error)
      return []
    }
  }

  async addUserToCompany(email: string, companyId: string, role: "admin" | "employee" = "employee"): Promise<{ success: boolean; error?: string }> {
    try {
      // First, find the user by email
      const { data: existingUser, error: findError } = await this.supabase
        .from('users')
        .select('id, company_id, role')
        .eq('email', email)
        .single()

      if (findError) {
        if (findError.code === 'PGRST116') {
          return { success: false, error: 'User with this email does not exist. They need to sign up first.' }
        }
        return { success: false, error: 'Error finding user: ' + findError.message }
      }

      if (existingUser.company_id) {
        return { success: false, error: 'User is already part of another organization' }
      }

      // Update the user to add them to the company
      const { error: updateError } = await this.supabase
        .from('users')
        .update({ 
          company_id: companyId,
          role: role
        })
        .eq('id', existingUser.id)

      if (updateError) {
        return { success: false, error: 'Error adding user to company: ' + updateError.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in addUserToCompany:', error)
      return { success: false, error: 'Unexpected error occurred' }
    }
  }

  async updateUser(userId: string, data: UpdateUserData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update(data)
        .eq('id', userId)

      if (error) {
        return { success: false, error: 'Error updating user: ' + error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in updateUser:', error)
      return { success: false, error: 'Unexpected error occurred' }
    }
  }

  async removeUserFromCompany(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ 
          company_id: null,
          role: 'visitor'
        })
        .eq('id', userId)

      if (error) {
        return { success: false, error: 'Error removing user from company: ' + error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in removeUserFromCompany:', error)
      return { success: false, error: 'Unexpected error occurred' }
    }
  }
}

export const userService = new UserService() 