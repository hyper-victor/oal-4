import { getUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { OnboardingClient } from './onboarding-client'

export default async function OnboardingPage() {
  const profile = await getUserProfile()
  const supabase = await createClient()
  
  // Get pending invites for the user's email
  const { data: invites } = await supabase
    .from('family_invites')
    .select(`
      *,
      families (
        name,
        slug
      )
    `)
    .eq('email', profile?.id ? (await supabase.auth.getUser()).data.user?.email : null)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to FamilyHub</h1>
          <p className="mt-2 text-gray-600">
            Let&apos;s get you set up with your family
          </p>
        </div>
        
        <OnboardingClient invites={invites || []} />
      </div>
    </div>
  )
}
