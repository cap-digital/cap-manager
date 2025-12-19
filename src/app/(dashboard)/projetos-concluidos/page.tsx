import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { ProjetosConcluidosClient } from './projetos-concluidos-client'

export default async function ProjetosConcluidosPage() {
  // Buscar cards de projetos concluídos
  const cards = await prisma.cardKanban.findMany({
    where: { area: 'projetos_concluidos' },
    orderBy: { ordem: 'asc' },
  })

  // Buscar os IDs dos cards de faturamento relacionados
  const faturamentoCardIds = cards
    .map(c => c.faturamentoCardId)
    .filter((id): id is number => id !== null)

  // Buscar os cards de faturamento para mostrar o status
  const faturamentoCards = faturamentoCardIds.length > 0
    ? await prisma.cardKanban.findMany({
        where: { id: { in: faturamentoCardIds } },
        select: { id: true, status: true },
      })
    : []

  // Criar mapa de status de faturamento
  const faturamentoStatusMap = new Map(
    faturamentoCards.map(c => [c.id, c.status])
  )

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
    link_relatorio: card.linkRelatorio,
    faturamento_card_id: card.faturamentoCardId,
    faturamento_status: card.faturamentoCardId
      ? faturamentoStatusMap.get(card.faturamentoCardId) || null
      : null,
    data_vencimento: card.dataVencimento?.toISOString().split('T')[0] || null,
    ordem: card.ordem,
    created_at: card.createdAt.toISOString(),
    updated_at: card.updatedAt.toISOString(),
  }))

  return (
    <div>
      <Header title="Projetos Concluídos" subtitle="Acompanhe o status de faturamento dos projetos concluídos" />
      <div className="p-4 lg:p-8">
        <ProjetosConcluidosClient cards={cardsFormatted} />
      </div>
    </div>
  )
}
