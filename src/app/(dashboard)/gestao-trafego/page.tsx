import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { GestaoTrafegoKanban } from './gestao-trafego-kanban'

export default async function GestaoTrafegoPage() {
  const [cardsRes, projetosRes, clientesRes, usuariosRes] = await Promise.all([
    supabaseAdmin
      .from(TABLES.cards_kanban)
      .select('*')
      .eq('area', 'gestao_trafego')
      .order('ordem', { ascending: true }),
    supabaseAdmin
      .from(TABLES.projetos)
      .select('*, clientes:cliente_id(id, nome), trader:cap_manager_usuarios!cap_manager_projetos_trader_id_fkey(id, nome)')
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
    data_vencimento: card.data_vencimento?.split('T')[0] || null,
    ordem: card.ordem,
    created_at: card.created_at,
    updated_at: card.updated_at,
  }))

  const projetosFormatted = projetos.map(p => ({
    id: p.id,
    nome: p.nome,
    tipo_cobranca: p.tipo_cobranca,
    data_fim: p.data_fim?.split('T')[0] || null,
    revisao_final_ok: p.revisao_final_ok,
    cliente: p.clientes,
    trader: p.trader,
  }))

  return (
    <div>
      <Header title="Gestao de Trafego" subtitle="Gerencie suas campanhas de trafego com Kanban" />
      <div className="p-4 lg:p-8">
        <GestaoTrafegoKanban
          cards={cardsFormatted}
          projetos={projetosFormatted}
          clientes={clientes}
          usuarios={usuarios}
        />
      </div>
    </div>
  )
}
