import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Get user's active family
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('active_family_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.active_family_id) {
      return NextResponse.json({ error: 'No active family found' }, { status: 400 })
    }

    // Fetch all family members
    const { data: familyMembers, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        avatar_url
      `)
      .eq('active_family_id', userProfile.active_family_id)
      .neq('id', user.id) // Exclude current user

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch family members' }, { status: 500 })
    }

    return NextResponse.json(familyMembers || [])
  } catch (error) {
    console.error('Unexpected error fetching family members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
