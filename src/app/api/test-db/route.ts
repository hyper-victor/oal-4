import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Get authenticated user
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Test basic connection
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, active_family_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ 
        error: 'Profile error', 
        details: profileError.message 
      }, { status: 500 })
    }

    // Test if event_updates table exists
    const { error: updatesError } = await supabase
      .from('event_updates')
      .select('count')
      .limit(1)

    // Test if event_invitations table exists
    const { error: invitationsError } = await supabase
      .from('event_invitations')
      .select('count')
      .limit(1)

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        name: profile.full_name,
        familyId: profile.active_family_id
      },
      tables: {
        event_updates: updatesError ? 'Error' : 'OK',
        event_invitations: invitationsError ? 'Error' : 'OK'
      },
      errors: {
        updates: updatesError?.message,
        invitations: invitationsError?.message
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
