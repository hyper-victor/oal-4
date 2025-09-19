import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreatePostDialog } from '@/components/app/create-post-dialog'
import { CreateEventDialog } from '@/components/app/create-event-dialog'
import { InviteDialog } from '@/components/app/invite-dialog'
import { EventItem } from '@/components/app/event-item'
import { PostItem } from '@/components/app/post-item'
import { getActiveFamilyId } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { Plus, Calendar, UserPlus, FolderPlus } from 'lucide-react'

interface Post {
  id: string
  content: string
  created_at: string
  author_id: string
  author?: {
    id: string
    display_name: string
  }
  likes?: string[]
        comments?: Array<{
          id: string
          content: string
          author_id: string
          author?: {
            id: string
            display_name: string
          }
          created_at: string
        }>
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

  // Use service role client to bypass RLS issues
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Fetch latest posts with likes and comments
  let posts: Post[] = []
  try {
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('id, content, created_at, author_id, likes, comments')
      .eq('family_id', activeFamilyId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (postsError) {
      console.error('Error fetching posts:', postsError)
    } else if (postsData && postsData.length > 0) {
      // Fetch author profiles for posts
      const authorIds = postsData.map(post => post.author_id)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', authorIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        // Fallback to posts without author data
        posts = postsData.map(post => ({ ...post, author: undefined }))
      } else {
        // Combine posts with author data
        posts = postsData.map(post => ({
          ...post,
          author: profiles?.find(profile => profile.id === post.author_id)
        }))
      }
    }
  } catch (error) {
    console.error('Error in posts fetch:', error)
  }

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
    .gte('starts_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Include events from 24 hours ago
    .order('starts_at', { ascending: true })
    .limit(5)


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
                    <PostItem
                      key={post.id}
                      id={post.id}
                      content={post.content}
                      created_at={post.created_at}
                      author={post.author || { id: '', display_name: 'Unknown' }}
                      initialLikesCount={post.likes?.length || 0}
                      initialComments={post.comments || []}
                    />
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
                What&apos;s happening next
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events && events.length > 0 ? (
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
                    />
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
              <CardTitle>This Month&apos;s Celebrations</CardTitle>
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