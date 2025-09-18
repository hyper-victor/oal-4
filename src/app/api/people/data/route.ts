import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getActiveFamilyId, getServerClient } from '@/lib/auth'

export async function GET() {
  try {
    // 1. Get session user and active family ID
    const session = await getSessionUser()
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const activeFamilyId = await getActiveFamilyId()
    if (!activeFamilyId) {
      return NextResponse.json(
        { message: 'No active family found' },
        { status: 400 }
      )
    }

    const supabase = await getServerClient()

    // 2. Fetch family info
    let familyName = 'Your Family'
    try {
      const { data: family } = await supabase
        .from('families')
        .select('name')
        .eq('id', activeFamilyId)
        .single()
      
      if (family) {
        familyName = family.name
      }
    } catch (error) {
      console.log('Could not fetch family name, using default')
    }

    // 3. Fetch family members
    let familyMembers: Array<{user_id: string; role: string; status: string; created_at: string}> = []
    try {
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', activeFamilyId)
        .eq('status', 'active')
      
      if (membersError) {
        console.error('Error fetching members:', membersError)
      } else {
        familyMembers = members || []
      }
    } catch {
      console.log('Could not fetch family members')
    }

    // 4. Fetch pending invites
    let pendingInvites: Array<{id: string; code: string; email: string | null; status: string; created_at: string}> = []
    try {
      const { data: invites, error: invitesError } = await supabase
        .from('family_invites')
        .select('*')
        .eq('family_id', activeFamilyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (invitesError) {
        console.error('Error fetching invites:', invitesError)
      } else {
        pendingInvites = invites || []
      }
    } catch {
      console.log('Could not fetch pending invites')
    }

    return NextResponse.json({
      familyName,
      familyMembers,
      pendingInvites,
      activeFamilyId,
      userId: session.user.id
    })

  } catch (error) {
    console.error('Error in people data API:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
