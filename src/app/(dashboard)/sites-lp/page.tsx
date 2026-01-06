import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { SimpleKanban } from '@/components/kanban/simple-kanban'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function SitesLPPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const [cardsRes, projetosRes, clientesRes, usuariosRes] = await Promise.all([
    supabaseAdmin
      .from(TABLES.cards_kanban)
      .select('*')
      .eq('area', 'sites_lp')
      .order('ordem', { ascending: true }),
    supabaseAdmin
      .from(TABLES.projetos)
      .select('id, nome')
      .order('nome', { ascending: true }),
    supabaseAdmin
      .from(TABLES.clientes)
      .select('id, nome')
      .eq('ativo', true)
      .order('nome', { ascending: true }),
    supabaseAdmin
      .from(TABLES.usuarios)
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
    responsavel_relatorio_id: card.responsavel_relatorio_id,
    responsavel_revisao_id: card.responsavel_revisao_id,
    revisao_relatorio_ok: card.revisao_relatorio_ok,
    link_relatorio: card.link_relatorio,
    faturamento_card_id: card.faturamento_card_id,
    data_vencimento: card.data_vencimento?.split('T')[0] || null,
    ordem: card.ordem,
    created_at: card.created_at,
    updated_at: card.updated_at,
  }))

  return (
    <div>
      <Header title="Sites/LP" subtitle="Gerencie sites e landing pages com Kanban" />
      <div className="p-4 lg:p-8">
        <SimpleKanban
          area="sites_lp"
          areaLabel="Sites/LP"
          cards={cardsFormatted}
          projetos={projetos}
          clientes={clientes}
          usuarios={usuarios}
          usuarioLogadoId={parseInt(session.user.id)}
        />
      </div>
    </div>
  )
}
