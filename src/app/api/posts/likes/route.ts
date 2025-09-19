import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser, getActiveFamilyId } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const likePostSchema = z.object({
  post_id: z.string().uuid()
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
    const { post_id } = likePostSchema.parse(body)

    // Verify the post exists and user has access to it
    const supabase = await createClient()
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, family_id, likes')
      .eq('id', post_id)
      .eq('family_id', activeFamilyId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get current likes array
    const currentLikes = (post.likes as string[]) || []
    
    // Check if user already liked the post
    if (currentLikes.includes(session.user.id)) {
      return NextResponse.json({ error: 'Post already liked' }, { status: 400 })
    }

    // Add user to likes array
    const updatedLikes = [...currentLikes, session.user.id]

    // Update post with new likes
    const { error } = await supabase
      .from('posts')
      .update({ likes: updatedLikes })
      .eq('id', post_id)

    if (error) {
      console.error('Error creating like:', error)
      return NextResponse.json({ error: 'Failed to create like' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    
    console.error('Unexpected error creating like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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
      .select('id, family_id, likes')
      .eq('id', post_id)
      .eq('family_id', activeFamilyId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get current likes array and remove user
    const currentLikes = (post.likes as string[]) || []
    const updatedLikes = currentLikes.filter(userId => userId !== session.user.id)

    // Update post with new likes
    const { error } = await supabase
      .from('posts')
      .update({ likes: updatedLikes })
      .eq('id', post_id)

    if (error) {
      console.error('Error removing like:', error)
      return NextResponse.json({ error: 'Failed to remove like' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error removing like:', error)
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
      .select('id, family_id, likes')
      .eq('id', post_id)
      .eq('family_id', activeFamilyId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get likes from JSON column
    const likes = (post.likes as string[]) || []
    const isLiked = likes.includes(session.user.id)
    const likesCount = likes.length

    return NextResponse.json({ 
      likesCount, 
      isLiked 
    })
  } catch (error) {
    console.error('Unexpected error fetching likes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
