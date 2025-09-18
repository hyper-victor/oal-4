'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Calendar, MapPin, Clock, Users, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type RSVPStatus = 'going' | 'maybe' | 'decline' | 'not_responded'

interface EventItemProps {
  id: string
  title: string
  starts_at: string
  ends_at?: string | null
  location?: string | null
  currentRsvp?: RSVPStatus
  onEventClick?: () => void
  showDetails?: boolean
}

export function EventItem({ 
  id, 
  title, 
  starts_at, 
  ends_at, 
  location, 
  currentRsvp = 'not_responded',
  onEventClick,
  showDetails = false
}: EventItemProps) {
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
        console.error('RSVP API Error:', error)
        throw new Error(error.error || `Failed to update RSVP: ${response.status}`)
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
      case 'decline':
        return 'destructive'
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
      case 'decline':
        return 'Decline'
      default:
        return 'RSVP'
    }
  }

  const formatEventDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy')
  }

  const formatEventTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a')
  }

  return (
    <div className="space-y-3 p-4 border rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 
              className="font-medium text-base cursor-pointer hover:text-blue-600 transition-colors"
              onClick={onEventClick}
            >
              {title}
            </h4>
            {showDetails && (
              <Badge variant="outline" className="text-xs">
                {formatEventDate(starts_at)}
              </Badge>
            )}
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatEventDate(starts_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {formatEventTime(starts_at)}
                {ends_at && ` - ${formatEventTime(ends_at)}`}
              </span>
            </div>
            {location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}
          </div>
        </div>
        
        {onEventClick && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEventClick}>
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={rsvpStatus === 'going' ? 'default' : 'outline'}
            onClick={() => handleRsvp('going')}
            disabled={isUpdating}
            className="h-8 px-3 text-xs"
          >
            Going
          </Button>
          
          <Button
            size="sm"
            variant={rsvpStatus === 'maybe' ? 'secondary' : 'outline'}
            onClick={() => handleRsvp('maybe')}
            disabled={isUpdating}
            className="h-8 px-3 text-xs"
          >
            Maybe
          </Button>
          
          <Button
            size="sm"
            variant={rsvpStatus === 'decline' ? 'destructive' : 'outline'}
            onClick={() => handleRsvp('decline')}
            disabled={isUpdating}
            className="h-8 px-3 text-xs"
          >
            Decline
          </Button>
        </div>
        
        {onEventClick && (
          <Button
            size="sm"
            variant="outline"
            onClick={onEventClick}
            className="h-8 px-3 text-xs"
          >
            View Details
          </Button>
        )}
      </div>
    </div>
  )
}
