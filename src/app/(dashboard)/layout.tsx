import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-stone-100">
        <div className="max-w-3xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
