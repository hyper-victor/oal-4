import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreateEventDialog } from '@/components/app/create-event-dialog'
import { getActiveFamilyId } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Plus, Calendar, MapPin, Clock, Users, MoreHorizontal } from 'lucide-react'
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns'

interface Event {
  id: string
  title: string
  description?: string
  starts_at: string
  ends_at?: string
  location?: string
  created_by: string
  created_at: string
  rsvps: Array<{
    user_id: string
    status: 'going' | 'maybe' | 'not_responded'
  }>
}

export default async function EventsPage() {
  const activeFamilyId = await getActiveFamilyId()
  
  if (!activeFamilyId) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="mt-2 text-gray-600">
            No active family found
          </p>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // Fetch all events with RSVPs
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      starts_at,
      ends_at,
      location,
      created_by,
      created_at,
      rsvps:event_rsvps(user_id, status)
    `)
    .eq('family_id', activeFamilyId)
    .order('starts_at', { ascending: true })

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isPast(date)) return format(date, 'MMM d, yyyy')
    return format(date, 'MMM d, yyyy')
  }

  const formatEventTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a')
  }

  const getEventStatus = (event: Event) => {
    const now = new Date()
    const startDate = new Date(event.starts_at)
    
    if (isPast(startDate)) return 'past'
    if (isToday(startDate)) return 'today'
    if (isFuture(startDate)) return 'upcoming'
    return 'upcoming'
  }

  const getRsvpCounts = (rsvps: Event['rsvps']) => {
    const going = rsvps?.filter(r => r.status === 'going').length || 0
    const maybe = rsvps?.filter(r => r.status === 'maybe').length || 0
    const total = rsvps?.length || 0
    return { going, maybe, total }
  }

  const upcomingEvents = events?.filter(event => getEventStatus(event) === 'upcoming') || []
  const todayEvents = events?.filter(event => getEventStatus(event) === 'today') || []
  const pastEvents = events?.filter(event => getEventStatus(event) === 'past') || []

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="mt-2 text-gray-600">
              View and manage all family events
            </p>
          </div>
          <CreateEventDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </CreateEventDialog>
        </div>
      </div>

      {events && events.length > 0 ? (
        <div className="space-y-8">
          {/* Today's Events */}
          {todayEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Events
              </h2>
              <div className="grid gap-4">
                {todayEvents.map((event: any) => {
                  const rsvpCounts = getRsvpCounts(event.rsvps || [])
                  return (
                    <Card key={event.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{event.title}</h3>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                Today
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3">{event.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatEventTime(event.starts_at)}
                                {event.ends_at && ` - ${formatEventTime(event.ends_at)}`}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {rsvpCounts.going} going, {rsvpCounts.maybe} maybe
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
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
              <div className="grid gap-4">
                {upcomingEvents.map((event: any) => {
                  const rsvpCounts = getRsvpCounts(event.rsvps || [])
                  return (
                    <Card key={event.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{event.title}</h3>
                              <Badge variant="outline">
                                {formatEventDate(event.starts_at)}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3">{event.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatEventTime(event.starts_at)}
                                {event.ends_at && ` - ${formatEventTime(event.ends_at)}`}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {rsvpCounts.going} going, {rsvpCounts.maybe} maybe
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
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
              <div className="grid gap-4">
                {pastEvents.slice(0, 5).map((event: any) => {
                  const rsvpCounts = getRsvpCounts(event.rsvps || [])
                  return (
                    <Card key={event.id} className="opacity-75">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-600">{event.title}</h3>
                              <Badge variant="outline" className="text-gray-500">
                                {formatEventDate(event.starts_at)}
                              </Badge>
                            </div>
                            <p className="text-gray-500 mb-3">{event.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatEventTime(event.starts_at)}
                                {event.ends_at && ` - ${formatEventTime(event.ends_at)}`}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {rsvpCounts.going} went, {rsvpCounts.maybe} maybe
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" disabled>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
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
          <CardHeader>
            <CardTitle>No Events Yet</CardTitle>
            <CardDescription>
              Create your first family event to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No events yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first family event to get started
              </p>
              <CreateEventDialog>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </CreateEventDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
