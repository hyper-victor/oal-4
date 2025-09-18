import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const inviteSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  memberIds: z.array(z.string().uuid('Invalid member ID')).min(1, 'At least one member must be selected')
})

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getSessionUser()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { eventId, memberIds } = inviteSchema.parse(body)

    const supabase = await createClient()

    // Get user's family ID
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('active_family_id')
      .eq('id', session.user.id)
      .single()

    if (!userProfile?.active_family_id) {
      return NextResponse.json({ error: 'No active family found' }, { status: 400 })
    }

    // Get member details
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', memberIds)
      .eq('active_family_id', userProfile.active_family_id)

    if (membersError) {
      return NextResponse.json({ error: 'Failed to verify members' }, { status: 500 })
    }

    if (members.length !== memberIds.length) {
      return NextResponse.json({ error: 'Some members not found in family' }, { status: 400 })
    }

    // Create invitations
    const invitations = memberIds.map(memberId => ({
      event_id: eventId,
      invited_user_id: memberId,
      invited_by: session.user.id,
      status: 'pending',
      created_at: new Date().toISOString()
    }))

    const { error: inviteError } = await supabase
      .from('event_invitations')
      .insert(invitations)

    if (inviteError) {
      console.error('Error creating invitations:', inviteError)
      return NextResponse.json({ error: 'Failed to send invitations' }, { status: 500 })
    }

    // TODO: Send email notifications here
    // For now, we'll just log the invitations
    console.log(`Sent ${invitations.length} invitations for event "${eventId}"`)

    return NextResponse.json({ 
      success: true, 
      message: `Invitations sent to ${invitations.length} family member(s)`,
      invitedMembers: members.map(m => ({ id: m.id, name: m.full_name, email: m.email }))
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    
    console.error('Unexpected error sending invitations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
