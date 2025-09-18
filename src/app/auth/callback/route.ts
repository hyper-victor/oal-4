import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  console.log('Auth callback received:', { code: !!code, next, origin })

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Exchange result:', { error: error?.message, user: !!data.user })
    
    if (!error && data.user) {
      // Check if user has an invite code in their metadata
      const inviteCode = data.user.user_metadata?.invite_code
      
      if (inviteCode) {
        try {
          // Try to accept the invite automatically
          const { error: acceptError } = await supabase.rpc('accept_invite', {
            p_code: inviteCode,
          })
          
          if (acceptError) {
            console.error('Error accepting invite:', acceptError)
            // If RPC fails, try to manually add user to family
            // This is a fallback for when invite codes aren't in the database
            console.log('Attempting manual family join for invite code:', inviteCode)
            
            // Get the user's active family ID from their profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('active_family_id')
              .eq('id', data.user.id)
              .single()
            
            if (profile?.active_family_id) {
              // User already has a family, that's fine
              console.log('User already has active family:', profile.active_family_id)
            } else {
              // Try to find a family that might match this invite code
              // This is a simplified approach - in a real app you'd want better invite tracking
              console.log('No active family found, user will need to join manually')
            }
          } else {
            console.log('Successfully accepted invite for user:', data.user.id)
          }
        } catch (err) {
          console.error('Error processing invite:', err)
          // Continue anyway - user can still use the app
        }
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      console.log('Redirecting to:', next)
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      console.error('Auth exchange error:', error)
    }
  } else {
    console.log('No code provided in callback')
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
