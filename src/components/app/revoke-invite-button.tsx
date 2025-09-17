'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface RevokeInviteButtonProps {
  inviteId: string
}

export function RevokeInviteButton({ inviteId }: RevokeInviteButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleRevoke = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/invites/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to revoke invite')
      }

      toast.success('Invite revoked successfully')
      // Trigger a page refresh to update the UI
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to revoke invite')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleRevoke}
      disabled={isLoading}
    >
      <X className="h-4 w-4" />
      {isLoading ? 'Revoking...' : 'Revoke'}
    </Button>
  )
}
