import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getActiveFamilyId } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

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

    const supabase = await createClient()

    // Test if the new tables exist
    const { data: commentsTable, error: commentsError } = await supabase
      .from('post_comments')
      .select('count')
      .limit(1)

    const { data: likesTable, error: likesError } = await supabase
      .from('post_likes')
      .select('count')
      .limit(1)

    return NextResponse.json({
      success: true,
      tablesExist: {
        post_comments: !commentsError,
        post_likes: !likesError
      },
      errors: {
        comments: commentsError?.message,
        likes: likesError?.message
      }
    })
  } catch (error) {
    console.error('Error testing tables:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
