'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Heart, MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'

interface Comment {
  id: string
  content: string
  created_at: string
  author: {
    id: string
    display_name: string
  }
}

interface PostItemProps {
  id: string
  content: string
  created_at: string
  author: {
    id: string
    display_name: string
  }
  initialLikesCount?: number
  initialIsLiked?: boolean
  initialComments?: Comment[]
}

export function PostItem({ 
  id, 
  content, 
  created_at, 
  author, 
  initialLikesCount = 0,
  initialIsLiked = false,
  initialComments = []
}: PostItemProps) {
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isTogglingLike, setIsTogglingLike] = useState(false)

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

  const handleLikeToggle = async () => {
    if (isTogglingLike) return
    
    setIsTogglingLike(true)
    try {
      if (isLiked) {
        // Unlike
        const response = await fetch(`/api/posts/likes?post_id=${id}`, {
          method: 'DELETE',
        })
        
        if (response.ok) {
          setIsLiked(false)
          setLikesCount(prev => Math.max(0, prev - 1))
        } else {
          const error = await response.json()
          if (error.error?.includes('relation') || error.error?.includes('table')) {
            toast.error('Database tables not created yet. Please apply the migration first.')
          } else {
            toast.error(error.error || 'Failed to unlike post')
          }
        }
      } else {
        // Like
        const response = await fetch('/api/posts/likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ post_id: id }),
        })
        
        if (response.ok) {
          setIsLiked(true)
          setLikesCount(prev => prev + 1)
        } else {
          const error = await response.json()
          if (error.error?.includes('relation') || error.error?.includes('table')) {
            toast.error('Database tables not created yet. Please apply the migration first.')
          } else {
            toast.error(error.error || 'Failed to like post')
          }
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like')
    } finally {
      setIsTogglingLike(false)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmittingComment) return
    
    setIsSubmittingComment(true)
    try {
      const response = await fetch('/api/posts/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          post_id: id, 
          content: newComment.trim() 
        }),
      })
      
      if (response.ok) {
        const newCommentData = await response.json()
        setComments(prev => [...prev, newCommentData])
        setNewComment('')
        toast.success('Comment added!')
      } else {
        const error = await response.json()
        if (error.error?.includes('relation') || error.error?.includes('table')) {
          toast.error('Database tables not created yet. Please apply the migration first.')
        } else {
          toast.error(error.error || 'Failed to add comment')
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/posts/comments?post_id=${id}`)
      if (response.ok) {
        const commentsData = await response.json()
        setComments(commentsData)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const loadLikes = async () => {
    try {
      const response = await fetch(`/api/posts/likes?post_id=${id}`)
      if (response.ok) {
        const likesData = await response.json()
        setLikesCount(likesData.likesCount)
        setIsLiked(likesData.isLiked)
      }
    } catch (error) {
      console.error('Error loading likes:', error)
    }
  }

  // Don't automatically load data to prevent errors when tables don't exist
  // Data will be loaded when user interacts with buttons

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
          {getInitials(author?.display_name || 'Unknown')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{author?.display_name || 'Unknown'}</span>
            <Badge variant="secondary" className="text-xs">Family</Badge>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(created_at)}
            </span>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{content}</p>
          
          {/* Like and Comment buttons */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLikeToggle}
              disabled={isTogglingLike}
              className={`flex items-center gap-1 text-xs ${
                isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount > 0 && <span>{likesCount}</span>}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowComments(!showComments)
                if (!showComments) {
                  loadComments()
                }
              }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <MessageCircle className="h-4 w-4" />
              {comments.length > 0 && <span>{comments.length}</span>}
            </Button>
          </div>

          {/* Comments section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t">
              {/* Comment form */}
              <form onSubmit={handleCommentSubmit} className="mb-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] resize-none"
                    disabled={isSubmittingComment}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              {/* Comments list */}
              {comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium">
                        {getInitials(comment.author?.display_name || 'User')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-xs">{comment.author?.display_name || 'User'}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
