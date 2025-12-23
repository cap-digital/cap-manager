import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/layout/header'
import { FollowUpClient } from './follow-up-client'

// Determina qual grupo de revisão é para hoje
function getGrupoRevisaoHoje(): ('A' | 'B' | 'C')[] {
  const hoje = new Date()
  const diaSemana = hoje.getDay() // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

  const grupos: ('A' | 'B' | 'C')[] = ['A'] // Grupo A sempre aparece

  // Grupo B: Segunda (1), Quarta (3), Sexta (5)
  if ([1, 3, 5].includes(diaSemana)) {
    grupos.push('B')
  }

  // Grupo C: Terça (2), Quinta (4)
  if ([2, 4].includes(diaSemana)) {
    grupos.push('C')
  }

  return grupos
}

// Retorna o nome do dia da semana
function getNomeDiaSemana(): string {
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  return dias[new Date().getDay()]
}

export default async function FollowUpPage() {
  const session = await getServerSession(authOptions)

  const currentUser = session?.user?.email
    ? await prisma.usuario.findUnique({
        where: { email: session.user.email },
      })
    : null

  const gruposHoje = getGrupoRevisaoHoje()
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  // Buscar projetos ativos com grupo de revisão definido que devem ser revisados hoje
  const [projetosParaRevisar, revisoesHoje, traders] = await Promise.all([
    prisma.projeto.findMany({
      where: {
        status: 'ativo',
        grupoRevisao: { in: gruposHoje },
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        trader: { select: { id: true, nome: true } },
        colaborador: { select: { id: true, nome: true } },
        estrategias: true,
      },
      orderBy: [
        { cliente: { nome: 'asc' } },
        { nome: 'asc' },
      ],
    }),
    prisma.revisaoDiaria.findMany({
      where: {
        dataAgendada: hoje,
      },
      select: {
        projetoId: true,
        revisado: true,
        dataRevisao: true,
        revisadoPor: { select: { id: true, nome: true } },
      },
    }),
    prisma.usuario.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  // Criar um mapa de revisões para fácil acesso
  const revisoesMap = new Map(
    revisoesHoje.map(r => [r.projetoId, r])
  )

  // Formatar projetos com status de revisão
  const projetosFormatted = projetosParaRevisar.map(projeto => {
    const revisao = revisoesMap.get(projeto.id)
    return {
      id: projeto.id,
      nome: projeto.nome,
      cliente_id: projeto.clienteId,
      cliente: projeto.cliente,
      trader_id: projeto.traderId,
      trader: projeto.trader,
      colaborador_id: projeto.colaboradorId,
      colaborador: projeto.colaborador,
      status: projeto.status,
      grupo_revisao: projeto.grupoRevisao as 'A' | 'B' | 'C',
      data_inicio: projeto.dataInicio?.toISOString().split('T')[0] || null,
      data_fim: projeto.dataFim?.toISOString().split('T')[0] || null,
      revisado_hoje: revisao?.revisado || false,
      data_revisao: revisao?.dataRevisao?.toISOString() || null,
      revisado_por: revisao?.revisadoPor || null,
      estrategias: projeto.estrategias.map(e => ({
        id: e.id,
        plataforma: e.plataforma,
        estrategia: e.estrategia,
        status: e.status,
        data_inicio: e.dataInicio?.toISOString().split('T')[0] || null,
        gasto_ate_momento: e.gastoAteMomento ? Number(e.gastoAteMomento) : null,
        entregue_ate_momento: e.entregueAteMomento ? Number(e.entregueAteMomento) : null,
        data_atualizacao: e.dataAtualizacao?.toISOString().split('T')[0] || null,
      })),
    }
  })

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
        title="Revisão Diária"
        subtitle={`${getNomeDiaSemana()} - Grupos ${gruposHoje.join(', ')}`}
      />
      <div className="p-4 lg:p-8">
        <FollowUpClient
          projetos={projetosFormatted}
          gruposHoje={gruposHoje}
          traders={traders}
          currentUser={currentUserFormatted}
        />
      </div>
    </div>
  )
}
