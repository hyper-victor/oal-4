import { NextResponse } from 'next/server'
import { getSessionUser, getActiveFamilyId } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
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

    // Use service role client to bypass RLS and prevent stack depth issues
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 2. Fetch family info
    let familyName = 'Your Family'
    try {
      const { data: family } = await supabase
        .from('families')
        .select('name')
        .eq('id', activeFamilyId)
        .single()
      
      if (family) {
        familyName = family.name
      }
    } catch {
      console.log('Could not fetch family name, using default')
    }

    // 3. Fetch family members with profile information
    let familyMembers: Array<{user_id: string; role: string; status: string; created_at: string; email: string | null; name: string | null}> = []
    try {
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('user_id, role, status, created_at')
        .eq('family_id', activeFamilyId)
        .eq('status', 'active')
      
      if (membersError) {
        console.error('Error fetching members:', membersError)
      } else if (members) {
        // Fetch profile information for each member
        const memberIds = members.map(m => m.user_id)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', memberIds)
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError)
          // Fallback to just user IDs if profile fetch fails
          familyMembers = members.map(m => ({ ...m, email: null, name: null }))
        } else {
          // Fetch emails from auth.users for each member
          const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
          
          if (authError) {
            console.error('Error fetching auth users:', authError)
            // Fallback to just display names
            familyMembers = members.map(member => {
              const profile = profiles?.find(p => p.id === member.user_id)
              return {
                ...member,
                email: null,
                name: profile?.display_name || null
              }
            })
          } else {
            // Combine member data with profile and auth data
            familyMembers = members.map(member => {
              const profile = profiles?.find(p => p.id === member.user_id)
              const authUser = authUsers?.users?.find(u => u.id === member.user_id)
              return {
                ...member,
                email: authUser?.email || null,
                name: profile?.display_name || null
              }
            })
          }
        }
      }
    } catch (error) {
      console.log('Could not fetch family members:', error)
    }

    // 4. Fetch pending invites - simplified query to avoid stack depth issues
    let pendingInvites: Array<{id: string; code: string; email: string | null; status: string; created_at: string}> = []
    try {
      const { data: invites, error: invitesError } = await supabase
        .from('family_invites')
        .select('id, code, email, status, created_at')
        .eq('family_id', activeFamilyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (invitesError) {
        console.error('Error fetching invites:', invitesError)
      } else {
        pendingInvites = invites || []
      }
    } catch (error) {
      console.log('Could not fetch pending invites:', error)
    }

    return NextResponse.json({
      familyName,
      familyMembers,
      pendingInvites,
      activeFamilyId,
      userId: session.user.id
    })

  } catch (error) {
    console.error('Error in people data API:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
