import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'
import { z } from 'zod'

const createFamilySchema = z.object({
  name: z.string().min(1, 'Family name is required'),
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
    const { name } = createFamilySchema.parse(body)

    // Generate slug from name
    const slug = slugify(name)

    // Check if slug already exists
    const { data: existingFamily } = await supabase
      .from('families')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingFamily) {
      return NextResponse.json(
        { error: 'A family with this name already exists' },
        { status: 400 }
      )
    }

    // Create family using RPC
    const { data: familyId, error: createError } = await supabase.rpc('create_family', {
      p_name: name,
      p_slug: slug,
    })

    if (createError) {
      console.error('Error creating family:', createError)
      return NextResponse.json(
        { error: 'Failed to create family' },
        { status: 500 }
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
