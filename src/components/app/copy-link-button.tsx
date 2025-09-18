'use client'

import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

interface CopyLinkButtonProps {
  inviteCode: string
}

export function CopyLinkButton({ inviteCode }: CopyLinkButtonProps) {
  const handleCopyLink = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?code=${inviteCode}`
      await navigator.clipboard.writeText(url)
      toast.success('Invite URL copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleCopyLink}
    >
      <Copy className="h-4 w-4 mr-1" />
      Copy Link
    </Button>
  )
}
