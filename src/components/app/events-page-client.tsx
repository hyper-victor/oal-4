'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreateEventDialog } from './create-event-dialog'
import { EventItem } from './event-item'
import { EventDetailsModal } from './event-details-modal'
import { Plus, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface Event {
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

interface EventsPageClientProps {
  events: Event[]
}

export function EventsPageClient({ events }: EventsPageClientProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // const formatEventDate = (dateString: string) => {
  //   return format(new Date(dateString), 'MMM d, yyyy')
  // }

  // const formatEventTime = (dateString: string) => {
  //   return format(new Date(dateString), 'h:mm a')
  // }

  const getEventStatus = (event: Event) => {
    const now = new Date()
    const startDate = new Date(event.starts_at)

    const diffInHours = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffInHours > 24) return 'upcoming'
    if (diffInHours > 0) return 'today'
    return 'past'
  }

  // const getRsvpCounts = (rsvps: Array<{ user_id: string; status: string }> = []) => {
  //   return rsvps.reduce((counts, rsvp) => {
  //     counts[rsvp.status as keyof typeof counts]++
  //     return counts
  //   }, { going: 0, maybe: 0, decline: 0, not_responded: 0 })
  // }

  const todayEvents = events.filter(event => getEventStatus(event) === 'today')
  const upcomingEvents = events.filter(event => getEventStatus(event) === 'upcoming')
  const pastEvents = events.filter(event => getEventStatus(event) === 'past')

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
  }

  const handleRsvpUpdate = (status: string) => {
    if (selectedEvent) {
      // Update the event's RSVP status
      setSelectedEvent({
        ...selectedEvent,
        rsvps: selectedEvent.rsvps?.map(rsvp => 
          rsvp.user_id === 'current-user' ? { ...rsvp, status } : rsvp
        ) || [{ user_id: 'current-user', status }]
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">View and manage all family events</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Events Content */}
      {events.length > 0 ? (
        <div className="space-y-8">
          {/* All Events */}
          {events.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                All Events
              </h2>
              <div className="space-y-3">
                {events.map((event: Event) => (
                  <EventItem
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    starts_at={event.starts_at}
                    ends_at={event.ends_at}
                    location={event.location}
                    currentRsvp={event.rsvps?.[0]?.status || 'not_responded'}
                    onEventClick={() => handleEventClick(event)}
                    showDetails={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Today's Events */}
          {todayEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today&apos;s Events
              </h2>
              <div className="space-y-3">
                {todayEvents.map((event: Event) => (
                  <div key={event.id} className="border-l-4 border-l-blue-500">
                    <EventItem
                      id={event.id}
                      title={event.title}
                      starts_at={event.starts_at}
                      ends_at={event.ends_at}
                      location={event.location}
                      currentRsvp={event.rsvps?.[0]?.status || 'not_responded'}
                      onEventClick={() => handleEventClick(event)}
                      showDetails={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </h2>
              <div className="space-y-3">
                {upcomingEvents.map((event: Event) => (
                  <EventItem
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    starts_at={event.starts_at}
                    ends_at={event.ends_at}
                    location={event.location}
                    currentRsvp={event.rsvps?.[0]?.status || 'not_responded'}
                    onEventClick={() => handleEventClick(event)}
                    showDetails={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Past Events
              </h2>
              <div className="space-y-3">
                {pastEvents.slice(0, 5).map((event: Event) => (
                  <div key={event.id} className="opacity-75">
                    <EventItem
                      id={event.id}
                      title={event.title}
                      starts_at={event.starts_at}
                      ends_at={event.ends_at}
                      location={event.location}
                      currentRsvp={event.rsvps?.[0]?.status || 'not_responded'}
                      onEventClick={() => handleEventClick(event)}
                      showDetails={true}
                    />
                  </div>
                ))}
                {pastEvents.length > 5 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Showing 5 of {pastEvents.length} past events
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Create your first family event to get started
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateEventDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          currentRsvp={selectedEvent.rsvps?.[0]?.status || 'not_responded'}
          onRsvpUpdate={handleRsvpUpdate}
        />
      )}
    </div>
  )
}
