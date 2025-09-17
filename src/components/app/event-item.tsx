'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type RSVPStatus = 'going' | 'maybe' | 'not_responded'

interface EventItemProps {
  id: string
  title: string
  starts_at: string
  ends_at?: string | null
  location?: string | null
  currentRsvp?: RSVPStatus
}

export function EventItem({ id, title, starts_at, ends_at, location, currentRsvp = 'not_responded' }: EventItemProps) {
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>(currentRsvp)
  const [isUpdating, setIsUpdating] = useState(false)

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleRsvp = async (status: RSVPStatus) => {
    setIsUpdating(true)
    try {
      const response = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: id,
          status
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update RSVP')
      }

      setRsvpStatus(status)
      toast.success('RSVP updated!')
    } catch (error) {
      console.error('Error updating RSVP:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update RSVP')
    } finally {
      setIsUpdating(false)
    }
  }

  const getRsvpButtonVariant = (status: RSVPStatus) => {
    switch (status) {
      case 'going':
        return 'default'
      case 'maybe':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRsvpButtonText = (status: RSVPStatus) => {
    switch (status) {
      case 'going':
        return 'Going'
      case 'maybe':
        return 'Maybe'
      default:
        return '•••'
    }
  }

  return (
    <div className="space-y-2 p-3 border rounded-lg">
      <div>
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(starts_at)}
          {ends_at && ` - ${formatDateTime(ends_at)}`}
        </p>
        {location && (
          <p className="text-xs text-muted-foreground">📍 {location}</p>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={getRsvpButtonVariant(rsvpStatus)}
          onClick={() => handleRsvp(rsvpStatus === 'going' ? 'not_responded' : 'going')}
          disabled={isUpdating}
          className="h-6 px-2 text-xs"
        >
          {getRsvpButtonText(rsvpStatus)}
        </Button>
        
        <Button
          size="sm"
          variant={rsvpStatus === 'maybe' ? 'secondary' : 'outline'}
          onClick={() => handleRsvp(rsvpStatus === 'maybe' ? 'not_responded' : 'maybe')}
          disabled={isUpdating}
          className="h-6 px-2 text-xs"
        >
          Maybe
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              disabled={isUpdating}
              className="h-6 px-1 text-xs"
            >
              ⋯
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleRsvp('not_responded')}
              className={rsvpStatus === 'not_responded' ? 'bg-accent' : ''}
            >
              Not responded
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
