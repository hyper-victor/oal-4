'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyLinkButton } from '@/components/app/copy-link-button'
import { InviteDialog } from '@/components/app/invite-dialog'
import { Button } from '@/components/ui/button'
import { Users, UserPlus } from 'lucide-react'

interface FamilyMember {
  user_id: string
  role: string
  status: string
  created_at: string
}

interface PendingInvite {
  id: string
  code: string
  email: string | null
  status: string
  created_at: string
}

interface PeopleData {
  familyName: string
  familyMembers: FamilyMember[]
  pendingInvites: PendingInvite[]
}

export function PeopleData() {
  const [data, setData] = useState<PeopleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/people/data')
        if (!response.ok) {
          throw new Error('Failed to fetch people data')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Fetching family data...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>No Data</CardTitle>
            <CardDescription>Unable to load family data</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Family Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Family Members ({data.familyMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.familyMembers.length > 0 ? (
              data.familyMembers.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      User {member.user_id.slice(0, 8)}...
                    </p>
                    <p className="text-sm text-muted-foreground">{member.user_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      member.role === 'admin' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No family members found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {data.pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites ({data.pendingInvites.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {invite.email || 'No email specified'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Code: {invite.code}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(invite.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                      pending
                    </span>
                    <CopyLinkButton inviteCode={invite.code} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Section */}
      <Card>
        <CardHeader className="text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle>Invite New Members</CardTitle>
          <CardDescription>
            As an admin, you can invite new members to your family.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <InviteDialog>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite a Member
            </Button>
          </InviteDialog>
        </CardContent>
      </Card>
    </div>
  )
}
