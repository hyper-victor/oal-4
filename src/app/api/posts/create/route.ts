import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser, getActiveFamilyId } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be less than 5000 characters')
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
    const { content } = createPostSchema.parse(body)

    // Create post in database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('posts')
      .insert({
        family_id: activeFamilyId,
        author_id: session.user.id,
        content: content.trim()
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    console.error('Unexpected error creating post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
