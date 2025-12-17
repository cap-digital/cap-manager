import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { ProjetosFinalizadosClient } from './projetos-finalizados-client'

export default async function ProjetosFinalizadosPage() {
  const [cards, projetos, clientes, usuarios] = await Promise.all([
    prisma.cardKanban.findMany({
      where: { area: 'projetos_finalizados' },
      orderBy: { ordem: 'asc' },
    }),
    prisma.projeto.findMany({
      where: { tipoCobranca: 'fee' },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.cliente.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.usuario.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  const cardsFormatted = cards.map(card => ({
    id: card.id,
    titulo: card.titulo,
    descricao: card.descricao,
    area: card.area,
    status: card.status,
    prioridade: card.prioridade as 'baixa' | 'media' | 'alta' | 'urgente',
    cliente_id: card.clienteId,
    projeto_id: card.projetoId,
    trader_id: card.traderId,
    data_vencimento: card.dataVencimento?.toISOString().split('T')[0] || null,
    ordem: card.ordem,
    created_at: card.createdAt.toISOString(),
    updated_at: card.updatedAt.toISOString(),
  }))

  return (
    <div>
      <Header title="Projetos Finalizados" subtitle="Projetos FEE finalizados" />
      <div className="p-4 lg:p-8">
        <ProjetosFinalizadosClient
          cards={cardsFormatted}
          projetos={projetos}
          clientes={clientes}
          usuarios={usuarios}
        />
      </div>
    </div>
  )
}
