'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const joinCodeSchema = z.object({
  code: z.string().min(6, 'Code must be at least 6 characters').max(8, 'Code must be at most 8 characters'),
})

const createFamilySchema = z.object({
  name: z.string().min(1, 'Family name is required'),
})

type JoinCodeForm = z.infer<typeof joinCodeSchema>
type CreateFamilyForm = z.infer<typeof createFamilySchema>

interface Invite {
  id: string
  code: string
  families: {
    name: string
    slug: string
  }
}

interface OnboardingClientProps {
  invites: Invite[]
}

export function OnboardingClient({ invites }: OnboardingClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register: registerCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: codeErrors },
  } = useForm<JoinCodeForm>({
    resolver: zodResolver(joinCodeSchema),
  })

  const {
    register: registerFamily,
    handleSubmit: handleSubmitFamily,
    formState: { errors: familyErrors },
  } = useForm<CreateFamilyForm>({
    resolver: zodResolver(createFamilySchema),
  })

  const onJoinByCode = async (data: JoinCodeForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/onboarding/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: data.code }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to join family')
        return
      }

      toast.success('Successfully joined family!')
      router.push('/dashboard')
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const onCreateFamily = async (data: CreateFamilyForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/onboarding/create-family', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: data.name }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to create family')
        return
      }

      toast.success('Family created successfully!')
      router.push('/dashboard')
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const onJoinInvite = async (inviteId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/onboarding/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteId }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to join family')
        return
      }

      toast.success('Successfully joined family!')
      router.push('/dashboard')
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Pending Invites */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              You have been invited to join these families
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{invite.families.name}</h3>
                  <p className="text-sm text-gray-500">Code: {invite.code}</p>
                </div>
                <Button
                  onClick={() => onJoinInvite(invite.id)}
                  disabled={isLoading}
                >
                  Join Family
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Join by Code */}
      <Card>
        <CardHeader>
          <CardTitle>Join with Code</CardTitle>
          <CardDescription>
            Enter a family code to join an existing family
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitCode(onJoinByCode)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Family Code</Label>
              <Input
                id="code"
                placeholder="Enter family code"
                {...registerCode('code')}
              />
              {codeErrors.code && (
                <p className="text-sm text-red-600">{codeErrors.code.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Joining...' : 'Join Family'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center">
        <Separator className="flex-1" />
        <span className="px-4 text-sm text-gray-500">OR</span>
        <Separator className="flex-1" />
      </div>

      {/* Create New Family */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Family</CardTitle>
          <CardDescription>
            Start your own family and invite others to join
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitFamily(onCreateFamily)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="familyName">Family Name</Label>
              <Input
                id="familyName"
                placeholder="Enter family name"
                {...registerFamily('name')}
              />
              {familyErrors.name && (
                <p className="text-sm text-red-600">{familyErrors.name.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Family'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
