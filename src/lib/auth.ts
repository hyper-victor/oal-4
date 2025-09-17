import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  // Check if user email is confirmed
  if (user.email_confirmed_at === null) {
    return null
  }
  
  return user
}

export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return profile
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect('/signin')
  }
  return user
}

export async function requireAuthWithFamily() {
  const user = await getUser()
  if (!user) {
    redirect('/signin')
  }
  
  const profile = await getUserProfile()
  if (!profile?.active_family_id) {
    redirect('/onboarding')
  }
  
  return { user, profile }
}
