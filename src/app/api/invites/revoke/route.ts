import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser, getActiveFamilyId, requireAdmin, getServerClient } from '@/lib/auth'

const revokeInviteSchema = z.object({
  inviteId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
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

    // 2. Ensure current user is admin
    try {
      await requireAdmin(activeFamilyId)
    } catch {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const { inviteId } = revokeInviteSchema.parse(body)

    // 4. Update invite status to revoked
    const supabase = await getServerClient()
    const { data, error } = await supabase
      .from('family_invites')
      .update({ status: 'revoked' })
      .eq('id', inviteId)
      .eq('family_id', activeFamilyId)
      .eq('status', 'pending')
      .select()

    if (error) {
      console.error('Error revoking invite:', error)
      return NextResponse.json(
        { message: 'Failed to revoke invite' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: 'Invite not found or already processed' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Error in revoke invite API:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
