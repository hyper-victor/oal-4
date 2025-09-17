import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreatePostDialog } from '@/components/app/create-post-dialog'
import { CreateEventDialog } from '@/components/app/create-event-dialog'
import { InviteDialog } from '@/components/app/invite-dialog'
import { EventItem } from '@/components/app/event-item'
import { getActiveFamilyId } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Plus, Users, Calendar, MessageSquare, UserPlus, FolderPlus } from 'lucide-react'

interface Post {
  id: string
  content: string
  created_at: string
  author_id: string
  author?: {
    id: string
    display_name: string
  }
}

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

export default async function DashboardPage() {
  const activeFamilyId = await getActiveFamilyId()
  
  if (!activeFamilyId) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            No active family found
          </p>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // Fetch latest posts
  const { data: postsData } = await supabase
    .from('posts')
    .select('id, content, created_at, author_id')
    .eq('family_id', activeFamilyId)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch author profiles for posts
  const authorIds = postsData?.map(post => post.author_id) || []
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', authorIds)

  // Combine posts with author data
  const posts = postsData?.map(post => ({
    ...post,
    author: profiles?.find(profile => profile.id === post.author_id)
  })) || []

  // Fetch upcoming events with RSVPs
  const { data: events } = await supabase
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
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(5)

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Family Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Stay connected with your family
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get things done
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CreatePostDialog>
              <Button className="h-auto p-4 flex flex-col items-center gap-2 bg-black hover:bg-gray-800">
                <Plus className="h-5 w-5" />
                <span className="text-sm">Create Post</span>
              </Button>
            </CreatePostDialog>
            
            <CreateEventDialog>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm">Create Event</span>
              </Button>
            </CreateEventDialog>
            
            <InviteDialog>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <UserPlus className="h-5 w-5" />
                <span className="text-sm">Invite Member</span>
              </Button>
            </InviteDialog>
            
            <Button 
              variant="outline" 
              disabled 
              className="h-auto p-4 flex flex-col items-center gap-2"
              title="Coming soon"
            >
              <FolderPlus className="h-5 w-5" />
              <span className="text-sm">New Subgroup</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Timeline Feed</CardTitle>
              <CardDescription>
                Latest updates from your family
              </CardDescription>
            </CardHeader>
            <CardContent>
              {posts && posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post: Post) => (
                    <div key={post.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {getInitials(post.author?.display_name || 'Unknown')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{post.author?.display_name || 'Unknown'}</span>
                            <Badge variant="secondary" className="text-xs">Family</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(post.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No posts yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Share your first update with your family
                  </p>
                  <CreatePostDialog>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                  </CreatePostDialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>
                What's happening next
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events && events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event: Event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <p className="text-xs text-gray-500">
                          {new Date(event.starts_at).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant={event.rsvps?.[0]?.status === 'going' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {event.rsvps?.[0]?.status === 'going' ? 'Going' : 
                         event.rsvps?.[0]?.status === 'maybe' ? 'Maybe' : 'RSVP'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-3xl mb-3">📅</div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    No upcoming events
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Create your first family event
                  </p>
                  <CreateEventDialog>
                    <Button size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Create Event
                    </Button>
                  </CreateEventDialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* This Month's Celebrations */}
          <Card>
            <CardHeader>
              <CardTitle>This Month's Celebrations</CardTitle>
              <CardDescription>
                Birthdays and special days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-gray-400 text-3xl mb-3">🎂</div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Coming soon
                </h3>
                <p className="text-xs text-gray-500">
                  Birthday tracking will be available soon
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}