import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar dados do usuário
  const { data: userData } = await supabase
    .from('cap_manager_usuarios')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar user={userData} />
      <div className="lg:pl-64 transition-all duration-300">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}
