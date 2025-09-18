import { getActiveFamilyId, getCurrentUserRole, getServerClient } from '@/lib/auth'
import { MemberRow } from '@/components/app/member-row'
import { InviteDialog } from '@/components/app/invite-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus } from 'lucide-react'
import Link from 'next/link'

interface Member {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: 'admin' | 'member'
  email?: string
}

interface ProfileData {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export default async function PeoplePage() {
  const activeFamilyId = await getActiveFamilyId()
  
  if (!activeFamilyId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Family</CardTitle>
            <CardDescription>
              You need to be part of a family to view members.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const currentUserRole = await getCurrentUserRole(activeFamilyId)
  const supabase = await getServerClient()

  // Get all active family members
  const { data: members, error: membersError } = await supabase
    .from('family_members')
    .select('user_id, role')
    .eq('family_id', activeFamilyId)
    .eq('status', 'active')

  if (membersError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Failed to load family members: {membersError.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Get profiles for all members
  const userIds = members?.map(member => member.user_id) || []
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  if (profilesError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Failed to load profiles: {profilesError.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Combine the data
  const combinedMembers = members?.map(member => {
    const profile = profiles?.find(p => p.id === member.user_id)
    return {
      user_id: member.user_id,
      role: member.role,
      profiles: profile
    }
  }) || []

  const memberList: Member[] = combinedMembers.map(member => ({
    id: member.user_id,
    display_name: member.profiles?.display_name || null,
    avatar_url: member.profiles?.avatar_url || null,
    role: member.role,
  }))

  const isAdmin = currentUserRole === 'admin'
  const hasMultipleMembers = memberList.length > 1

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">People</h1>
        <p className="text-muted-foreground">
          View and manage your family members
        </p>
      </div>

      {!hasMultipleMembers ? (
        <Card>
          <CardHeader className="text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Just You</CardTitle>
            <CardDescription>
              You&apos;re the only member of this family. {isAdmin ? 'Invite others to get started!' : 'Ask an admin to invite more members.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {isAdmin ? (
              <InviteDialog>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite a Member
                </Button>
              </InviteDialog>
            ) : (
              <p className="text-sm text-muted-foreground">
                Contact an admin to invite more members
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Family Members ({memberList.length})
            </h2>
            {isAdmin && (
              <InviteDialog>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </InviteDialog>
            )}
          </div>
          
          <div className="grid gap-4">
            {memberList.map((member) => (
              <MemberRow
                key={member.id}
                name={member.display_name || `Member ${member.id.slice(0, 6)}`}
                role={member.role}
                avatarUrl={member.avatar_url || undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
