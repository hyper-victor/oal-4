import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function GalleryPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
        <p className="mt-2 text-gray-600">
          Share and view family photos and memories
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Family Gallery</CardTitle>
          <CardDescription>
            All your family photos and shared memories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">🖼️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No photos yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start sharing photos with your family
            </p>
            <p className="text-sm text-gray-400">
              Coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
