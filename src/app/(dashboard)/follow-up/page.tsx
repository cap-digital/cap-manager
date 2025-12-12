import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/layout/header'
import { FollowUpClient } from './follow-up-client'

export default async function FollowUpPage() {
  const session = await getServerSession(authOptions)

  const currentUser = session?.user?.email
    ? await prisma.usuario.findUnique({
        where: { email: session.user.email },
      })
    : null

  const [campanhas, followUps, traders] = await Promise.all([
    prisma.campanha.findMany({
      where: { status: { in: ['ativa', 'pausada'] } },
      include: {
        cliente: { select: { nome: true } },
        trader: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.followUp.findMany({
      include: {
        campanha: {
          include: { cliente: { select: { nome: true } } },
        },
        trader: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.usuario.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  // Transform data to match expected types
  const campanhasFormatted = campanhas.map(c => ({
    id: c.id,
    nome: c.nome,
    status: c.status,
    cliente: c.cliente,
    trader: c.trader,
  }))

  const followUpsFormatted = followUps.map(f => ({
    id: f.id,
    conteudo: f.conteudo,
    tipo: f.tipo,
    created_at: f.createdAt.toISOString(),
    campanha: f.campanha
      ? {
          id: f.campanha.id,
          nome: f.campanha.nome,
          cliente: f.campanha.cliente,
        }
      : null,
    trader: f.trader,
  }))

  const currentUserFormatted = currentUser
    ? {
        id: currentUser.id,
        email: currentUser.email,
        nome: currentUser.nome,
        avatar_url: currentUser.avatarUrl,
        role: currentUser.role as 'admin' | 'trader' | 'gestor' | 'cliente',
        whatsapp: currentUser.whatsapp,
        ativo: currentUser.ativo,
        created_at: currentUser.createdAt.toISOString(),
        updated_at: currentUser.updatedAt.toISOString(),
      }
    : null

  return (
    <div>
      <Header
        title="Follow-up de Campanhas"
        subtitle="Acompanhe o progresso das campanhas por trader"
      />
      <div className="p-4 lg:p-8">
        <FollowUpClient
          campanhas={campanhasFormatted}
          followUps={followUpsFormatted}
          traders={traders}
          currentUser={currentUserFormatted}
        />
      </div>
    </div>
  )
}
