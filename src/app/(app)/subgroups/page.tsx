import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SubgroupsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subgroups</h1>
        <p className="mt-2 text-gray-600">
          Manage your family subgroups and smaller circles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Family Subgroups</CardTitle>
          <CardDescription>
            Create and manage smaller groups within your family
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No subgroups yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first subgroup to organize family members
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
