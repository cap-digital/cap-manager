import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { UsuariosClient } from './usuarios-client'

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions)

  // Verificar se usuário é admin
  if (!session || session.user.role !== 'admin') {
    redirect('/')
  }

  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      email: true,
      nome: true,
      role: true,
      whatsapp: true,
      ativo: true,
      createdAt: true,
    },
    orderBy: { nome: 'asc' },
  })

  const usuariosFormatted = usuarios.map(u => ({
    id: u.id,
    email: u.email,
    nome: u.nome,
    role: u.role as 'admin' | 'trader' | 'gestor' | 'cliente',
    whatsapp: u.whatsapp,
    ativo: u.ativo,
    created_at: u.createdAt.toISOString(),
  }))

  return (
    <div>
      <Header title="Gerenciamento de Usuários" subtitle="Gerencie os usuários do sistema" />
      <div className="p-4 lg:p-8">
        <UsuariosClient usuarios={usuariosFormatted} />
      </div>
    </div>
  )
}
