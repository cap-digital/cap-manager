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

  const [projetos, followUps, traders] = await Promise.all([
    prisma.projeto.findMany({
      where: { status: { in: ['ativo', 'pausado'] } },
      include: {
        cliente: { select: { nome: true } },
        trader: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.followUp.findMany({
      include: {
        projeto: {
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
  const projetosFormatted = projetos.map(p => ({
    id: p.id,
    nome: p.nome,
    status: p.status,
    cliente: p.cliente,
    trader: p.trader,
  }))

  const followUpsFormatted = followUps.map(f => ({
    id: f.id,
    conteudo: f.conteudo,
    tipo: f.tipo,
    created_at: f.createdAt.toISOString(),
    projeto: f.projeto
      ? {
          id: f.projeto.id,
          nome: f.projeto.nome,
          cliente: f.projeto.cliente,
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
        title="Follow-up de Projetos"
        subtitle="Acompanhe o progresso dos projetos por trader"
      />
      <div className="p-4 lg:p-8">
        <FollowUpClient
          projetos={projetosFormatted}
          followUps={followUpsFormatted}
          traders={traders}
          currentUser={currentUserFormatted}
        />
      </div>
    </div>
  )
}
