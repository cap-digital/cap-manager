import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { TarefasKanban } from './tarefas-kanban'

export default async function TarefasPage() {
  const [tarefasRes, projetosRes, clientesRes, usuariosRes] = await Promise.all([
    supabaseAdmin
      .from(TABLES.tarefas)
      .select('*, projetos:cap_manager_projetos!cap_manager_tarefas_projeto_id_fkey(id, nome), clientes:cap_manager_clientes!cap_manager_projetos_cliente_id_fkey(id, nome), responsavel:cap_manager_usuarios!cap_manager_tarefas_responsavel_id_fkey(id, nome)')
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

  const tarefas = tarefasRes.data || []
  const projetos = projetosRes.data || []
  const clientes = clientesRes.data || []
  const usuarios = usuariosRes.data || []

  // Transform data to match expected types (snake_case for frontend compatibility)
  const tarefasFormatted = tarefas.map(tarefa => ({
    id: tarefa.id,
    titulo: tarefa.titulo,
    descricao: tarefa.descricao,
    status: tarefa.status as 'backlog' | 'todo' | 'doing' | 'review' | 'done',
    prioridade: tarefa.prioridade as 'baixa' | 'media' | 'alta' | 'urgente',
    projeto_id: tarefa.projeto_id,
    projeto: tarefa.projetos,
    cliente_id: tarefa.cliente_id,
    cliente: tarefa.clientes,
    responsavel_id: tarefa.responsavel_id,
    responsavel: tarefa.responsavel,
    data_vencimento: tarefa.data_vencimento?.split('T')[0] || null,
    ordem: tarefa.ordem,
    created_at: tarefa.created_at,
    updated_at: tarefa.updated_at,
  }))

  return (
    <div>
      <Header title="Tarefas" subtitle="Gerencie suas tarefas com Kanban" />
      <div className="p-4 lg:p-8">
        <TarefasKanban
          tarefas={tarefasFormatted}
          projetos={projetos}
          clientes={clientes}
          usuarios={usuarios}
        />
      </div>
    </div>
  )
}
