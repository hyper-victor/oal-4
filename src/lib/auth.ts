import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getServerClient() {
  return await createClient()
}

export async function getSessionUser() {
  const supabase = await getServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  // Check if user email is confirmed
  if (user.email_confirmed_at === null) {
    return null
  }
  
  return { user }
}

export async function getActiveFamilyId() {
  const session = await getSessionUser()
  if (!session) {
    return null
  }

  const supabase = await getServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('active_family_id')
    .eq('id', session.user.id)
    .single()
  
  return profile?.active_family_id || null
}

export async function getCurrentUserRole(familyId: string) {
  const session = await getSessionUser()
  if (!session) {
    return null
  }

  const supabase = await getServerClient()
  const { data: member } = await supabase
    .from('family_members')
    .select('role')
    .eq('family_id', familyId)
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single()
  
  return member?.role || null
}

export async function requireAdmin(familyId: string) {
  const role = await getCurrentUserRole(familyId)
  if (role !== 'admin') {
    throw new Error('Admin access required')
  }
  return true
}

// Legacy functions for backward compatibility
export async function getUser() {
  const session = await getSessionUser()
  return session?.user || null
}

export async function getUserProfile() {
  const session = await getSessionUser()
  if (!session) {
    return null
  }
  
  const supabase = await getServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
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
