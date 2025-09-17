import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, User } from 'lucide-react'
import Image from 'next/image'

interface MemberRowProps {
  name: string
  role: 'admin' | 'member'
  email?: string
  avatarUrl?: string
}

export function MemberRow({ name, role, email, avatarUrl }: MemberRowProps) {
  return (
    <Card className="p-4">
      <CardContent className="flex items-center gap-3 p-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <User className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{name}</span>
            <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
              {role}
            </Badge>
          </div>
          {email && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <a
                href={`mailto:${email}`}
                className="hover:text-foreground transition-colors"
              >
                {email}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
