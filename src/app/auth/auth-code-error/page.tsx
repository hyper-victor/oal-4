import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem confirming your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              The confirmation link may have expired or been used already.
            </p>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Try signing up again</p>
              <p>• Check if you already confirmed your email</p>
              <p>• Contact support if the problem persists</p>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <Button asChild className="w-full">
              <Link href="/signup">
                Try Signing Up Again
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
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
