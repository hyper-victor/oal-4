import { getActiveFamilyId, getCurrentUserRole, getServerClient } from '@/lib/auth'
import { MemberRow } from '@/components/app/member-row'
import { InviteDialog } from '@/components/app/invite-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Users, Clock } from 'lucide-react'
import { RevokeInviteButton } from '@/components/app/revoke-invite-button'

interface Member {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: 'admin' | 'member'
}

interface ProfileData {
  id: string
  display_name: string | null
  avatar_url: string | null
}

interface PendingInvite {
  id: string
  email: string | null
  code: string
  status: string
  expires_at: string
  created_at: string
}

export default async function SettingsPage() {
  const activeFamilyId = await getActiveFamilyId()
  
  if (!activeFamilyId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Family</CardTitle>
            <CardDescription>
              You need to be part of a family to manage settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const currentUserRole = await getCurrentUserRole(activeFamilyId)
  const supabase = await getServerClient()

  // Get all active family members with their profiles
  const { data: members, error: membersError } = await supabase
    .from('family_members')
    .select(`
      user_id,
      role,
      profiles!inner (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('family_id', activeFamilyId)
    .eq('status', 'active')

  // Get pending invites (only for admins)
  let pendingInvites: PendingInvite[] = []
  if (currentUserRole === 'admin') {
    const { data: invites, error: invitesError } = await supabase
      .from('family_invites')
      .select('id, email, code, status, expires_at, created_at')
      .eq('family_id', activeFamilyId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (!invitesError && invites) {
      pendingInvites = invites
    }
  }

  if (membersError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Failed to load family data: {membersError.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const memberList: Member[] = members?.map(member => ({
    id: member.user_id,
    display_name: (member.profiles as unknown as ProfileData).display_name,
    avatar_url: (member.profiles as unknown as ProfileData).avatar_url,
    role: member.role,
  })) || []

  const isAdmin = currentUserRole === 'admin'

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your family and account settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Members Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family Members
                </CardTitle>
                <CardDescription>
                  Manage who has access to your family
                </CardDescription>
              </div>
              {isAdmin && (
                <InviteDialog>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </InviteDialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memberList.map((member) => (
                <MemberRow
                  key={member.id}
                  name={member.display_name || `Member ${member.id.slice(0, 6)}`}
                  role={member.role}
                  avatarUrl={member.avatar_url || undefined}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Invites Section (Admin only) */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Invites
              </CardTitle>
              <CardDescription>
                Invites that haven&apos;t been accepted yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvites.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No pending invites
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                            {invite.code}
                          </code>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                        {invite.email && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {invite.email}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Expires {new Date(invite.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <RevokeInviteButton inviteId={invite.id} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
