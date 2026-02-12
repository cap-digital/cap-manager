import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { Sidebar } from '@/components/layout/sidebar'
import { MainContent } from '@/components/layout/main-content'
import { SessionTimeout } from '@/components/auth/session-timeout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  // Buscar dados do usuário
  const userId = parseInt(session.user.id)
  const { data: userData } = await supabaseAdmin
    .from(TABLES.usuarios)
    .select('*')
    .eq('id', userId)
    .single()

  return (
    <div className="min-h-screen bg-muted/30">
      <SessionTimeout />
      <Sidebar
        user={
          userData
            ? {
                nome: userData.nome,
                email: userData.email,
                avatar_url: userData.avatar_url,
                role: userData.role,
              }
            : null
        }
      />
      <MainContent>{children}</MainContent>
    </div>
  )
}
