import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/sidebar'

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
  const userData = await prisma.usuario.findUnique({
    where: { id: userId },
  })

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar
        user={
          userData
            ? {
                nome: userData.nome,
                email: userData.email,
                avatar_url: userData.avatarUrl,
              }
            : null
        }
      />
      <div className="lg:pl-64 transition-all duration-300">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}
