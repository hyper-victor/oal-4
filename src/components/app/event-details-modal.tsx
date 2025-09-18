'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { EventInviteDialog } from './event-invite-dialog'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  MessageSquare, 
  UserPlus, 
  Edit, 
  Trash2,
  Share2,
  Send
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface EventDetailsModalProps {
  event: {
    id: string
    title: string
    description?: string
    starts_at: string
    ends_at?: string
    location?: string
    created_by: string
    created_at: string
    rsvps?: Array<{ user_id: string; status: string }>
  }
  isOpen: boolean
  onClose: () => void
  currentRsvp: string
  onRsvpUpdate: (status: string) => void
}

interface EventUpdate {
  id: string
  content: string
  created_at: string
  author: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

export function EventDetailsModal({ 
  event, 
  isOpen, 
  onClose, 
  currentRsvp, 
  onRsvpUpdate 
}: EventDetailsModalProps) {
  const [isAddingUpdate, setIsAddingUpdate] = useState(false)
  const [updateText, setUpdateText] = useState('')
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false)
  const [eventUpdates, setEventUpdates] = useState<EventUpdate[]>([])
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  // Load event updates when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchEventUpdates()
    }
  }, [isOpen, event.id, fetchEventUpdates])

  const fetchEventUpdates = useCallback(async () => {
    setIsLoadingUpdates(true)
    try {
      const response = await fetch(`/api/events/updates?eventId=${event.id}`)
      if (response.ok) {
        const updates = await response.json()
        setEventUpdates(updates)
      } else {
        // If API fails, just show empty state
        setEventUpdates([])
      }
    } catch {
      // If API fails, just show empty state
      setEventUpdates([])
    } finally {
      setIsLoadingUpdates(false)
    }
  }, [event.id])

  const formatEventDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMM d, yyyy')
  }

  const formatEventTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a')
  }

  const getRsvpCounts = (rsvps: Array<{ user_id: string; status: string }> = []) => {
    return rsvps.reduce((counts, rsvp) => {
      counts[rsvp.status as keyof typeof counts]++
      return counts
    }, { going: 0, maybe: 0, decline: 0, not_responded: 0 })
  }

  const rsvpCounts = getRsvpCounts(event.rsvps)

  const handleAddUpdate = async () => {
    if (!updateText.trim()) return

    setIsSubmittingUpdate(true)
    try {
      const response = await fetch('/api/events/updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          content: updateText.trim()
        }),
      })

      if (response.ok) {
        const newUpdate = await response.json()
        setEventUpdates(prev => [newUpdate, ...prev])
        toast.success('Update added!')
        setUpdateText('')
        setIsAddingUpdate(false)
      } else {
        // If API fails, just show a simple message
        toast.info('Update feature coming soon!')
        setUpdateText('')
        setIsAddingUpdate(false)
      }
    } catch {
      // If API fails, just show a simple message
      toast.info('Update feature coming soon!')
      setUpdateText('')
      setIsAddingUpdate(false)
    } finally {
      setIsSubmittingUpdate(false)
    }
  }

  const handleInvitePeople = () => {
    setIsInviteDialogOpen(true)
  }

  const handleEditEvent = () => {
    // TODO: Implement edit functionality
    toast.info('Edit functionality coming soon!')
  }

  const handleDeleteEvent = () => {
    // TODO: Implement delete functionality
    toast.info('Delete functionality coming soon!')
  }

  const handleShareEvent = () => {
    // TODO: Implement share functionality
    navigator.clipboard.writeText(window.location.href)
    toast.success('Event link copied to clipboard!')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="font-medium">{formatEventDate(event.starts_at)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <span>
                {formatEventTime(event.starts_at)}
                {event.ends_at && ` - ${formatEventTime(event.ends_at)}`}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <span>{event.location}</span>
              </div>
            )}

            {event.description && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600">{event.description}</p>
              </div>
            )}
          </div>

          {/* RSVP Section */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">RSVP</h4>
            <div className="flex items-center gap-2 mb-4">
              <Button
                size="sm"
                variant={currentRsvp === 'going' ? 'default' : 'outline'}
                onClick={() => onRsvpUpdate('going')}
                className="h-8 px-4"
              >
                Going
              </Button>
              <Button
                size="sm"
                variant={currentRsvp === 'maybe' ? 'secondary' : 'outline'}
                onClick={() => onRsvpUpdate('maybe')}
                className="h-8 px-4"
              >
                Maybe
              </Button>
              <Button
                size="sm"
                variant={currentRsvp === 'decline' ? 'destructive' : 'outline'}
                onClick={() => onRsvpUpdate('decline')}
                className="h-8 px-4"
              >
                Decline
              </Button>
            </div>

            {/* RSVP Counts */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{rsvpCounts.going} going</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{rsvpCounts.maybe} maybe</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{rsvpCounts.decline} declined</span>
              </div>
            </div>
          </div>

          {/* Event Updates */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Updates</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingUpdate(!isAddingUpdate)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Update
              </Button>
            </div>

            {isAddingUpdate && (
              <div className="space-y-3 mb-4">
                <Textarea
                  placeholder="Share an update about this event..."
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddUpdate}
                    disabled={isSubmittingUpdate || !updateText.trim()}
                  >
                    {isSubmittingUpdate ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Add Update
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAddingUpdate(false)
                      setUpdateText('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Event Updates */}
            {isLoadingUpdates ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading updates...</p>
              </div>
            ) : eventUpdates.length === 0 ? (
              <div className="text-sm text-gray-500 italic">
                No updates yet. Be the first to share an update!
              </div>
            ) : (
              <div className="space-y-3">
                {eventUpdates.map((update) => (
                  <div key={update.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-gray-600">
                          {update.author.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{update.author.full_name}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(update.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{update.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Actions</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleInvitePeople}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite People
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleEditEvent}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleShareEvent}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeleteEvent}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Event Invite Dialog */}
      <EventInviteDialog
        eventId={event.id}
        eventTitle={event.title}
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
      />
    </Dialog>
  )
}
