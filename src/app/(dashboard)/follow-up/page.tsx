import { supabaseAdmin, TABLES } from '@/lib/supabase'
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

  let currentUser = null
  if (session?.user?.email) {
    const { data } = await supabaseAdmin
      .from(TABLES.usuarios)
      .select('*')
      .eq('email', session.user.email)
      .single()
    currentUser = data
  }

  const gruposHoje = getGrupoRevisaoHoje()
  const hoje = new Date().toISOString().split('T')[0]

  // Buscar projetos ativos com grupo de revisão definido que devem ser revisados hoje
  const [projetosRes, revisoesRes, tradersRes] = await Promise.all([
    supabaseAdmin
      .from(TABLES.projetos)
      .select(`
        *,
        clientes:cliente_id(id, nome),
        trader:cap_manager_usuarios!cap_manager_projetos_trader_id_fkey(id, nome),
        colaborador:cap_manager_usuarios!cap_manager_projetos_colaborador_id_fkey(id, nome),
        estrategias(*)
      `)
      .eq('status', 'ativo')
      .in('grupo_revisao', gruposHoje)
      .order('nome', { ascending: true }),
    supabaseAdmin
      .from(TABLES.revisoes_diarias)
      .select('projeto_id, revisado, data_revisao, revisado_por:cap_manager_usuarios!cap_manager_revisoes_diarias_revisado_por_id_fkey(id, nome)')
      .eq('data_agendada', hoje),
    supabaseAdmin
      .from(TABLES.usuarios)
      .select('id, nome')
      .eq('ativo', true)
      .order('nome', { ascending: true }),
  ])

  const projetosParaRevisar = projetosRes.data || []
  const revisoesHoje = revisoesRes.data || []
  const traders = tradersRes.data || []

  // Criar um mapa de revisões para fácil acesso
  const revisoesMap = new Map(
    revisoesHoje.map(r => [r.projeto_id, r])
  )

  // Formatar projetos com status de revisão
  const projetosFormatted = projetosParaRevisar.map(projeto => {
    const revisao = revisoesMap.get(projeto.id)
    return {
      id: projeto.id,
      nome: projeto.nome,
      cliente_id: projeto.cliente_id,
      cliente: projeto.clientes,
      trader_id: projeto.trader_id,
      trader: projeto.trader,
      colaborador_id: projeto.colaborador_id,
      colaborador: projeto.colaborador,
      status: projeto.status,
      grupo_revisao: projeto.grupo_revisao as 'A' | 'B' | 'C',
      data_inicio: projeto.data_inicio?.split('T')[0] || null,
      data_fim: projeto.data_fim?.split('T')[0] || null,
      revisado_hoje: revisao?.revisado || false,
      data_revisao: revisao?.data_revisao || null,
      revisado_por: Array.isArray(revisao?.revisado_por) ? revisao.revisado_por[0] || null : revisao?.revisado_por || null,
      estrategias: (projeto.estrategias || []).map((e: any) => ({
        id: e.id,
        plataforma: e.plataforma,
        estrategia: e.estrategia,
        status: e.status,
        data_inicio: e.data_inicio?.split('T')[0] || null,
        gasto_ate_momento: e.gasto_ate_momento ? Number(e.gasto_ate_momento) : null,
        entregue_ate_momento: e.entregue_ate_momento ? Number(e.entregue_ate_momento) : null,
        data_atualizacao: e.data_atualizacao?.split('T')[0] || null,
      })),
    }
  })

  const currentUserFormatted = currentUser
    ? {
        id: currentUser.id,
        email: currentUser.email,
        nome: currentUser.nome,
        avatar_url: currentUser.avatar_url,
        role: currentUser.role as 'admin' | 'trader' | 'gestor' | 'cliente',
        whatsapp: currentUser.whatsapp,
        ativo: currentUser.ativo,
        created_at: currentUser.created_at,
        updated_at: currentUser.updated_at,
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
