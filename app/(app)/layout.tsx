import Nav from '@/components/Nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 pb-20 sm:pb-0">{children}</main>
    </div>
  )
}
