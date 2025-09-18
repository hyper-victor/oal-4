'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EventItem } from './event-item'
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
  MoreHorizontal
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
      // TODO: Implement event updates API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Update added!')
      setUpdateText('')
      setIsAddingUpdate(false)
    } catch (error) {
      toast.error('Failed to add update')
    } finally {
      setIsSubmittingUpdate(false)
    }
  }

  const handleInvitePeople = () => {
    // TODO: Implement invite functionality
    toast.info('Invite functionality coming soon!')
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
                    {isSubmittingUpdate ? 'Adding...' : 'Add Update'}
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

            {/* Placeholder for updates */}
            <div className="text-sm text-gray-500 italic">
              No updates yet. Be the first to share an update!
            </div>
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
    </Dialog>
  )
}
