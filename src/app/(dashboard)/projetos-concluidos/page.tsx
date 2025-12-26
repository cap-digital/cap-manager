import { supabaseAdmin } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { ProjetosConcluidosClient } from './projetos-concluidos-client'

export default async function ProjetosConcluidosPage() {
  // Buscar cards de projetos concluídos
  const { data: cards } = await supabaseAdmin
    .from('cards_kanban')
    .select('*')
    .eq('area', 'projetos_concluidos')
    .order('ordem', { ascending: true })

  // Buscar os IDs dos cards de faturamento relacionados
  const faturamentoCardIds = (cards || [])
    .map(c => c.faturamento_card_id)
    .filter((id): id is number => id !== null)

  // Buscar os cards de faturamento para mostrar o status
  let faturamentoCards: { id: number; status: string }[] = []
  if (faturamentoCardIds.length > 0) {
    const { data } = await supabaseAdmin
      .from('cards_kanban')
      .select('id, status')
      .in('id', faturamentoCardIds)
    faturamentoCards = data || []
  }

  // Criar mapa de status de faturamento
  const faturamentoStatusMap = new Map(
    faturamentoCards.map(c => [c.id, c.status])
  )

  const cardsFormatted = (cards || []).map(card => ({
    id: card.id,
    titulo: card.titulo,
    descricao: card.descricao,
    area: card.area,
    status: card.status,
    prioridade: card.prioridade as 'baixa' | 'media' | 'alta' | 'urgente',
    cliente_id: card.cliente_id,
    projeto_id: card.projeto_id,
    trader_id: card.trader_id,
    link_relatorio: card.link_relatorio,
    faturamento_card_id: card.faturamento_card_id,
    faturamento_status: card.faturamento_card_id
      ? faturamentoStatusMap.get(card.faturamento_card_id) || null
      : null,
    data_vencimento: card.data_vencimento?.split('T')[0] || null,
    ordem: card.ordem,
    created_at: card.created_at,
    updated_at: card.updated_at,
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
