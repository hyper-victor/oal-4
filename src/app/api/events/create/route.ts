import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser, getActiveFamilyId } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const createEventSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(120, 'Title must be less than 120 characters'),
  description: z.string().optional(),
  starts_at: z.string().min(1, 'Start date is required'),
  ends_at: z.string().optional(),
  location: z.string().optional()
}).refine((data) => {
  // Validate that dates are valid
  const startDate = new Date(data.starts_at)
  if (isNaN(startDate.getTime())) {
    return false
  }
  
  if (data.ends_at) {
    const endDate = new Date(data.ends_at)
    if (isNaN(endDate.getTime()) || endDate < startDate) {
      return false
    }
  }
  return true
}, {
  message: 'Invalid date format or end date must be after start date',
  path: ['starts_at']
})

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getSessionUser()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get active family
    const activeFamilyId = await getActiveFamilyId()
    if (!activeFamilyId) {
      return NextResponse.json({ error: 'No active family found' }, { status: 400 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { title, description, starts_at, ends_at, location } = createEventSchema.parse(body)

    // Create event in database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('events')
      .insert({
        family_id: activeFamilyId,
        title: title.trim(),
        description: description?.trim() || null,
        starts_at,
        ends_at: ends_at || null,
        location: location?.trim() || null,
        created_by: session.user.id
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    console.error('Unexpected error creating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
