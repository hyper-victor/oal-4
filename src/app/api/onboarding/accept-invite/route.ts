import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const acceptInviteSchema = z.object({
  code: z.string().min(6).max(8).optional(),
  inviteId: z.string().uuid().optional(),
}).refine((data) => data.code || data.inviteId, {
  message: "Either code or inviteId must be provided",
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and confirmed
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.email_confirmed_at === null) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { code, inviteId } = acceptInviteSchema.parse(body)

    let familyId: string

    if (inviteId) {
      // Accept invite by ID
      const { data: invite, error: inviteError } = await supabase
        .from('family_invites')
        .select('*')
        .eq('id', inviteId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (inviteError || !invite) {
        return NextResponse.json(
          { error: 'Invalid or expired invitation' },
          { status: 400 }
        )
      }

      // Add user to family
      const { error: memberError } = await supabase
        .from('family_members')
        .upsert({
          family_id: invite.family_id,
          user_id: user.id,
          role: 'member',
          status: 'active',
        })

      if (memberError) {
        console.error('Error adding member:', memberError)
        return NextResponse.json(
          { error: 'Failed to join family' },
          { status: 500 }
        )
      }

      // Update invite status
      await supabase
        .from('family_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId)

      // Update user's active family
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          active_family_id: invite.family_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }

      familyId = invite.family_id
    } else if (code) {
      // Accept invite by code using RPC
      const { data: resultFamilyId, error: acceptError } = await supabase.rpc('accept_invite', {
        p_code: code,
      })

      if (acceptError) {
        console.error('Error accepting invite:', acceptError)
        return NextResponse.json(
          { error: 'Invalid or expired code' },
          { status: 400 }
        )
      }

      familyId = resultFamilyId
    } else {
      return NextResponse.json(
        { error: 'Either code or inviteId must be provided' },
        { status: 400 }
      )
    }

    return NextResponse.json({ familyId })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
