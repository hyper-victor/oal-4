import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const rsvpSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  status: z.enum(['going', 'maybe', 'not_responded'], {
    errorMap: () => ({ message: 'Status must be going, maybe, or not_responded' })
  })
})

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getSessionUser()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { eventId, status } = rsvpSchema.parse(body)

    // Upsert RSVP in database
    const supabase = await createClient()
    const { error } = await supabase
      .from('event_rsvps')
      .upsert({
        event_id: eventId,
        user_id: session.user.id,
        status
      })

    if (error) {
      console.error('Error updating RSVP:', error)
      return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    console.error('Unexpected error updating RSVP:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
