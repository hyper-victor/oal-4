import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser, getActiveFamilyId } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const createCommentSchema = z.object({
  post_id: z.string().uuid(),
  content: z.string().min(1, 'Content is required').max(1000, 'Content must be less than 1000 characters')
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
    const { post_id, content } = createCommentSchema.parse(body)

    // Verify the post exists and user has access to it
    const supabase = await createClient()
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, family_id, comments')
      .eq('id', post_id)
      .eq('family_id', activeFamilyId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get current comments array
    const currentComments = (post.comments as Array<{
      id: string
      content: string
      author_id: string
      author?: {
        id: string
        display_name: string
      }
      created_at: string
    }>) || []
    
    // Get author profile for display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', session.user.id)
      .single()
    
    // If profile lookup fails, try to get it from the user's email or use a fallback
    let displayName = 'User'
    if (profile?.display_name) {
      displayName = profile.display_name
    } else if (session.user.email) {
      // Extract name from email as fallback
      displayName = session.user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    
    // Create new comment
    const newComment = {
      id: crypto.randomUUID(),
      content: content.trim(),
      author_id: session.user.id,
      author: {
        id: session.user.id,
        display_name: displayName
      },
      created_at: new Date().toISOString()
    }

    // Add comment to array
    const updatedComments = [...currentComments, newComment]

    // Update post with new comments
    const { error } = await supabase
      .from('posts')
      .update({ comments: updatedComments })
      .eq('id', post_id)

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    return NextResponse.json(newComment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    
    console.error('Unexpected error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const post_id = searchParams.get('post_id')

    if (!post_id) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 })
    }

    // Verify the post exists and user has access to it
    const supabase = await createClient()
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, family_id, comments')
      .eq('id', post_id)
      .eq('family_id', activeFamilyId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get comments from JSON column
    const comments = (post.comments as Array<{
      id: string
      content: string
      author_id: string
      author?: {
        id: string
        display_name: string
      }
      created_at: string
    }>) || []

    // Fetch current display names for all comment authors
    const authorIds = comments.map(comment => comment.author_id).filter(Boolean)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', authorIds)

    // Update comments with current display names
    const updatedComments = comments.map(comment => {
      const profile = profiles?.find(p => p.id === comment.author_id)
      return {
        ...comment,
        author: {
          id: comment.author_id,
          display_name: profile?.display_name || comment.author?.display_name || 'User'
        }
      }
    })

    return NextResponse.json(updatedComments)
  } catch (error) {
    console.error('Unexpected error fetching comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
