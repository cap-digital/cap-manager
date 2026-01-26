import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { MeusProjetosClient } from './meus-projetos-client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function MeusProjetosPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const userId = parseInt((session.user as any).id)

  // Buscar projetos onde o usuário é trader OU colaborador
  const { data: projetos, error } = await supabaseAdmin
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
    .or(`trader_id.eq.${userId},colaborador_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar projetos:', error)
  }

  // Transform data to match expected format
  const projetosFormatted = (projetos || []).map(projeto => ({
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

  return (
    <div>
      <Header
        title="Meus Projetos"
        subtitle="Projetos onde você é trader ou colaborador"
      />
      <div className="p-4 lg:p-8">
        <MeusProjetosClient projetos={projetosFormatted} />
      </div>
    </div>
  )
}
