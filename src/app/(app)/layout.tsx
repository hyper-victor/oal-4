import { requireAuthWithFamily } from '@/lib/auth'
import { Sidebar } from '@/components/app/sidebar'
import { Header } from '@/components/app/header'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuthWithFamily()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        
        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
