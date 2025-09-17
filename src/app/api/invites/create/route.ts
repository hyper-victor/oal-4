import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser, getActiveFamilyId, requireAdmin, getServerClient } from '@/lib/auth'

const createInviteSchema = z.object({
  email: z.string().email().optional(),
})

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

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
    const { email } = createInviteSchema.parse(body)

    // 4. Generate collision-safe code
    const supabase = await getServerClient()
    let code: string
    let attempts = 0
    const maxAttempts = 10

    do {
      code = generateInviteCode()
      const { data: existing } = await supabase
        .from('family_invites')
        .select('id')
        .eq('family_id', activeFamilyId)
        .eq('code', code)
        .eq('status', 'pending')
        .single()

      if (!existing) break
      attempts++
    } while (attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { message: 'Failed to generate unique code' },
        { status: 500 }
      )
    }

    // 5. Insert invite row
    const { error } = await supabase
      .from('family_invites')
      .insert({
        family_id: activeFamilyId,
        email: email || null,
        code,
        invited_by: session.user.id,
        status: 'pending',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invite:', error)
      return NextResponse.json(
        { message: 'Failed to create invite' },
        { status: 500 }
      )
    }

    // 6. Return code and URL
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/signup?code=${code}`
    
    return NextResponse.json({
      code,
      url,
    })

  } catch (error) {
    console.error('Error in create invite API:', error)
    
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
