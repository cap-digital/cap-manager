import { supabaseAdmin } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { SimpleKanban } from '@/components/kanban/simple-kanban'

export default async function DashboardsPage() {
  const [cardsRes, projetosRes, clientesRes, usuariosRes] = await Promise.all([
    supabaseAdmin
      .from('cards_kanban')
      .select('*')
      .eq('area', 'dashboards')
      .order('ordem', { ascending: true }),
    supabaseAdmin
      .from('projetos')
      .select('id, nome')
      .order('nome', { ascending: true }),
    supabaseAdmin
      .from('clientes')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome', { ascending: true }),
    supabaseAdmin
      .from('usuarios')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome', { ascending: true }),
  ])

  const cards = cardsRes.data || []
  const projetos = projetosRes.data || []
  const clientes = clientesRes.data || []
  const usuarios = usuariosRes.data || []

  const cardsFormatted = cards.map(card => ({
    id: card.id,
    titulo: card.titulo,
    descricao: card.descricao,
    area: card.area,
    status: card.status,
    prioridade: card.prioridade as 'baixa' | 'media' | 'alta' | 'urgente',
    cliente_id: card.cliente_id,
    projeto_id: card.projeto_id,
    trader_id: card.trader_id,
    data_vencimento: card.data_vencimento?.split('T')[0] || null,
    ordem: card.ordem,
    created_at: card.created_at,
    updated_at: card.updated_at,
  }))

  return (
    <div>
      <Header title="Dashboards" subtitle="Gerencie seus dashboards com Kanban" />
      <div className="p-4 lg:p-8">
        <SimpleKanban
          area="dashboards"
          areaLabel="Dashboards"
          cards={cardsFormatted}
          projetos={projetos}
          clientes={clientes}
          usuarios={usuarios}
        />
      </div>
    </div>
  )
}
