import { EventsPageClient } from '@/components/app/events-page-client'
import { getActiveFamilyId } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

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

  if (eventsError) {
    console.error('Error fetching events:', eventsError)
  }

  return <EventsPageClient events={events || []} />
}