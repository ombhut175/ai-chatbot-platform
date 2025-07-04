'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppRoute } from '@/helpers/string_const/routes'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(AppRoute.LOGIN + '?error=Invalid credentials')
  }

  revalidatePath(AppRoute.HOME, 'layout')
  redirect(AppRoute.DASHBOARD)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        name: formData.get('name') as string,
        company_name: formData.get('company_name') as string,
      },
    },
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect(AppRoute.SIGNUP + '?error=Could not authenticate user')
  }

  revalidatePath(AppRoute.HOME, 'layout')
  redirect(AppRoute.DASHBOARD)
} 