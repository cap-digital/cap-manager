import { notFound } from 'next/navigation'
import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { ProjetoDetalhesClient } from './projeto-detalhes-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjetoDetalhesPage({ params }: PageProps) {
  const { id } = await params
  const projetoId = parseInt(id)

  if (isNaN(projetoId)) {
    notFound()
  }

  const [projetoRes, usuariosRes, pisRes, agenciasRes, clientesRes] = await Promise.all([
    supabaseAdmin
      .from(TABLES.projetos)
      .select(`
        *,
        clientes:cap_manager_clientes!cap_manager_projetos_cliente_id_fkey(id, nome),
        trader:cap_manager_usuarios!cap_manager_projetos_trader_id_fkey(id, nome),
        colaborador:cap_manager_usuarios!cap_manager_projetos_colaborador_id_fkey(id, nome),
        pis:cap_manager_pis!cap_manager_projetos_pi_id_fkey(id, identificador, valor_bruto),
        agencias:cap_manager_agencias!cap_manager_projetos_agencia_id_fkey(id, nome),
        estrategias:cap_manager_estrategias(*)
      `)
      .eq('id', projetoId)
      .single(),
    supabaseAdmin
      .from(TABLES.usuarios)
      .select('id, nome')
      .eq('ativo', true)
      .order('nome', { ascending: true }),
    supabaseAdmin
      .from(TABLES.pis)
      .select('id, identificador, valor_bruto')
      .order('identificador', { ascending: true }),
    supabaseAdmin
      .from(TABLES.agencias)
      .select('id, nome')
      .order('nome', { ascending: true }),
    supabaseAdmin
      .from(TABLES.clientes)
      .select('id, nome')
      .eq('ativo', true)
      .order('nome', { ascending: true }),
  ])

  const projeto = projetoRes.data
  const usuarios = usuariosRes.data || []
  const pis = pisRes.data || []
  const agencias = agenciasRes.data || []
  const clientes = clientesRes.data || []

  if (!projeto) {
    notFound()
  }

  // Transform data to match expected format
  const projetoFormatted = {
    id: projeto.id,
    cliente_id: projeto.cliente_id,
    cliente: projeto.clientes,
    nome: projeto.nome,
    pi_id: projeto.pi_id,
    pi: projeto.pis ? {
      id: projeto.pis.id,
      identificador: projeto.pis.identificador,
      valor_bruto: Number(projeto.pis.valor_bruto),
    } : null,
    tipo_cobranca: projeto.tipo_cobranca,
    agencia_id: projeto.agencia_id,
    agencia: projeto.agencias ? {
      id: projeto.agencias.id,
      nome: projeto.agencias.nome,
    } : null,
    trader_id: projeto.trader_id,
    trader: projeto.trader,
    colaborador_id: projeto.colaborador_id,
    colaborador: projeto.colaborador,
    status: projeto.status,
    data_inicio: projeto.data_inicio?.split('T')[0] || null,
    data_fim: projeto.data_fim?.split('T')[0] || null,
    link_proposta: projeto.link_proposta,
    url_destino: projeto.url_destino,
    grupo_revisao: projeto.grupo_revisao,
    estrategias: (projeto.estrategias || []).map((e: any) => ({
      id: e.id,
      projeto_id: e.projeto_id,
      plataforma: e.plataforma,
      nome_conta: e.nome_conta,
      id_conta: e.id_conta,
      campaign_id: e.campaign_id,
      estrategia: e.estrategia,
      kpi: e.kpi,
      status: e.status,
      data_inicio: e.data_inicio?.split('T')[0] || null,
      valor_bruto: Number(e.valor_bruto),
      porcentagem_agencia: Number(e.porcentagem_agencia),
      porcentagem_plataforma: Number(e.porcentagem_plataforma),
      entrega_contratada: e.entrega_contratada ? Number(e.entrega_contratada) : null,
      gasto_ate_momento: e.gasto_ate_momento ? Number(e.gasto_ate_momento) : null,
      entregue_ate_momento: e.entregue_ate_momento ? Number(e.entregue_ate_momento) : null,
      data_atualizacao: e.data_atualizacao?.split('T')[0] || null,
      // Valores calculados
      valor_liquido: e.valor_liquido ? Number(e.valor_liquido) : null,
      valor_plataforma: e.valor_plataforma ? Number(e.valor_plataforma) : null,
      coeficiente: e.coeficiente ? Number(e.coeficiente) : null,
      valor_por_dia_plataforma: e.valor_por_dia_plataforma ? Number(e.valor_por_dia_plataforma) : null,
      valor_restante: e.valor_restante ? Number(e.valor_restante) : null,
      restante_por_dia: e.restante_por_dia ? Number(e.restante_por_dia) : null,
      percentual_entrega: e.percentual_entrega ? Number(e.percentual_entrega) : null,
      estimativa_resultado: e.estimativa_resultado ? Number(e.estimativa_resultado) : null,
      estimativa_sucesso: e.estimativa_sucesso ? Number(e.estimativa_sucesso) : null,
      meta_custo_resultado: e.meta_custo_resultado ? Number(e.meta_custo_resultado) : null,
      custo_resultado: e.custo_resultado ? Number(e.custo_resultado) : null,
      gasto_ate_momento_bruto: e.gasto_ate_momento_bruto ? Number(e.gasto_ate_momento_bruto) : null,
      valor_restante_bruto: e.valor_restante_bruto ? Number(e.valor_restante_bruto) : null,
      pode_abaixar_margem: e.pode_abaixar_margem,
      pode_aumentar_margem: e.pode_aumentar_margem,
      created_at: e.created_at,
      updated_at: e.updated_at,
    })),
    created_at: projeto.created_at,
    updated_at: projeto.updated_at,
  }

  const pisFormatted = pis.map(pi => ({
    id: pi.id,
    identificador: pi.identificador,
    valor_bruto: Number(pi.valor_bruto),
  }))

  const agenciasFormatted = agencias.map(agencia => ({
    id: agencia.id,
    nome: agencia.nome,
  }))

  return (
    <div>
      <Header
        title={projeto.nome}
        subtitle={projeto.clientes?.nome || 'Detalhes do projeto'}
        backHref="/projetos"
      />
      <div className="p-4 lg:p-8">
        <ProjetoDetalhesClient
          projeto={projetoFormatted}
          traders={usuarios}
          pis={pisFormatted}
          agencias={agenciasFormatted}
          clientes={clientes}
        />
      </div>
    </div>
  )
}
