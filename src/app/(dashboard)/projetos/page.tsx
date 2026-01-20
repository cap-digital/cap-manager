import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { ProjetosClient } from './projetos-client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProjetosPage() {
  // Automaticamente finalizar projetos com data_fim passada
  const hoje = new Date().toISOString().split('T')[0]

  await supabaseAdmin
    .from(TABLES.projetos)
    .update({ status: 'finalizado' })
    .eq('status', 'ativo')
    .lt('data_fim', hoje)

  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    redirect('/')
  }



  const [projetosRes, clientesRes, usuariosRes, pisRes, agenciasRes] = await Promise.all([
    supabaseAdmin
      .from(TABLES.projetos)
      .select(`
        *,
        clientes:cap_manager_clientes!cap_manager_projetos_cliente_id_fkey(id, nome),
        trader:cap_manager_usuarios!cap_manager_projetos_trader_id_fkey(id, nome),
        colaborador:cap_manager_usuarios!cap_manager_projetos_colaborador_id_fkey(id, nome),
        pis:cap_manager_pis!cap_manager_projetos_pi_id_fkey(id, identificador, valor_bruto, cliente_id),
        agencias:cap_manager_agencias!cap_manager_projetos_agencia_id_fkey(id, nome),
        estrategias:cap_manager_estrategias(*)
      `)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from(TABLES.clientes)
      .select('id, nome, tipo_cobranca')
      .eq('ativo', true)
      .order('nome', { ascending: true }),
    supabaseAdmin
      .from(TABLES.usuarios)
      .select('id, nome')
      .eq('ativo', true)
      .order('nome', { ascending: true }),
    supabaseAdmin
      .from(TABLES.pis)
      .select('id, identificador, valor_bruto, cliente_id')
      .order('identificador', { ascending: true }),
    supabaseAdmin
      .from(TABLES.agencias)
      .select('id, nome')
      .order('nome', { ascending: true }),
  ])

  const projetos = projetosRes.data || []
  const clientes = clientesRes.data || []
  const usuarios = usuariosRes.data || []
  const pis = pisRes.data || []
  const agencias = agenciasRes.data || []

  // Transform data to match expected format
  const projetosFormatted = projetos.map(projeto => ({
    id: projeto.id,
    cliente_id: projeto.cliente_id,
    cliente: projeto.clientes,
    nome: projeto.nome,
    pi_id: projeto.pi_id,
    pi: projeto.pis ? {
      id: projeto.pis.id,
      identificador: projeto.pis.identificador,
      valor_bruto: Number(projeto.pis.valor_bruto),
      cliente_id: projeto.pis.cliente_id || null,
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
    estrategias_count: projeto.estrategias?.length || 0,
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
      valor_bruto: Number(e.valor_bruto),
      porcentagem_agencia: Number(e.porcentagem_agencia),
      porcentagem_plataforma: Number(e.porcentagem_plataforma),
      entrega_contratada: e.entrega_contratada ? Number(e.entrega_contratada) : null,
      estimativa_resultado: e.estimativa_resultado ? Number(e.estimativa_resultado) : null,
      estimativa_sucesso: e.estimativa_sucesso ? Number(e.estimativa_sucesso) : null,
      gasto_ate_momento: e.gasto_ate_momento ? Number(e.gasto_ate_momento) : null,
      entregue_ate_momento: e.entregue_ate_momento ? Number(e.entregue_ate_momento) : null,
      data_atualizacao: e.data_atualizacao || null,
      created_at: e.created_at,
      updated_at: e.updated_at,
    })),
    created_at: projeto.created_at,
    updated_at: projeto.updated_at,
  }))

  const pisFormatted = pis.map(pi => ({
    id: pi.id,
    identificador: pi.identificador,
    valor_bruto: Number(pi.valor_bruto),
    cliente_id: pi.cliente_id || null,
  }))

  const agenciasFormatted = agencias.map(agencia => ({
    id: agencia.id,
    nome: agencia.nome,
  }))

  return (
    <div>
      <Header
        title="Projetos"
        subtitle="Gerencie seus projetos e estrategias de midia"
      />
      <div className="p-4 lg:p-8">
        <ProjetosClient
          projetos={projetosFormatted}
          clientes={clientes}
          traders={usuarios}
          pis={pisFormatted}
          agencias={agenciasFormatted}
        />
      </div>
    </div>
  )
}
