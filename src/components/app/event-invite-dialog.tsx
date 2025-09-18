'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { UserPlus, Search, Users, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface FamilyMember {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  is_invited?: boolean
}

interface EventInviteDialogProps {
  eventId: string
  eventTitle: string
  isOpen: boolean
  onClose: () => void
}

export function EventInviteDialog({ 
  eventId, 
  eventTitle, 
  isOpen, 
  onClose 
}: EventInviteDialogProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch family members when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchFamilyMembers()
    }
  }, [isOpen])

  const fetchFamilyMembers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/family/members')
      if (response.ok) {
        const members = await response.json()
        setFamilyMembers(members)
      } else {
        toast.error('Failed to load family members')
      }
    } catch (error) {
      console.error('Error fetching family members:', error)
      toast.error('Failed to load family members')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMembers = familyMembers.filter(member =>
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(filteredMembers.map(member => member.id))
    }
  }

  const handleSendInvites = async () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one family member')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/events/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          memberIds: selectedMembers,
        }),
      })

      if (response.ok) {
        toast.success(`Invitations sent to ${selectedMembers.length} family member(s)!`)
        onClose()
        setSelectedMembers([])
        setSearchQuery('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send invitations')
      }
    } catch (error) {
      console.error('Error sending invitations:', error)
      toast.error('Failed to send invitations')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Family Members
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Send invitations for &quot;{eventTitle}&quot; to family members
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search family members</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Select All */}
          {filteredMembers.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm font-medium">
                  Select All ({filteredMembers.length})
                </Label>
              </div>
              <Badge variant="secondary">
                {selectedMembers.length} selected
              </Badge>
            </div>
          )}

          {/* Family Members List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading family members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery ? 'No family members found matching your search' : 'No family members available'}
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    id={member.id}
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={() => handleMemberToggle(member.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {member.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.full_name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  {member.is_invited && (
                    <Badge variant="outline" className="text-xs">
                      Already Invited
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSendInvites}
              disabled={isSubmitting || selectedMembers.length === 0}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Invitations ({selectedMembers.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
