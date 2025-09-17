'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Suspense } from 'react'

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a confirmation link to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Sent to: <span className="font-medium">{email}</span>
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Click the link in the email to confirm your account and continue.
            </p>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Check your spam folder if you don&apos;t see the email</p>
              <p>• The link will expire in 24 hours</p>
              <p>• After confirming, you can sign in to your account</p>
            </div>
          </div>

          <div className="pt-4">
            <Button asChild className="w-full">
              <Link href="/signin">
                Go to Sign In
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  )
}
