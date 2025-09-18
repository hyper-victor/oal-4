import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const createUpdateSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  content: z.string().min(1, 'Content is required').max(1000, 'Content too long')
})

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { eventId, content } = createUpdateSchema.parse(body)

    const supabase = createClient()

    // Create the event update directly
    const { data: update, error: updateError } = await supabase
      .from('event_updates')
      .insert({
        event_id: eventId,
        author_id: user.id,
        content: content.trim()
      })
      .select(`
        id,
        content,
        created_at,
        author:profiles(id, full_name, avatar_url)
      `)
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to create update' }, { status: 500 })
    }

    return NextResponse.json(update)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Simple approach: just try to fetch updates directly
    const { data: updates, error: updatesError } = await supabase
      .from('event_updates')
      .select(`
        id,
        content,
        created_at,
        author:profiles(id, full_name, avatar_url)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (updatesError) {
      // If there's an error, just return empty array instead of failing
      return NextResponse.json([])
    }
    
    return NextResponse.json(updates || [])
  } catch (error) {
    // If anything fails, just return empty array
    return NextResponse.json([])
  }
}
