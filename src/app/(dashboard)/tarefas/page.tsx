import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { TarefasKanban } from './tarefas-kanban'

export default async function TarefasPage() {
  const supabase = await createClient()

  const [{ data: tarefas }, { data: campanhas }, { data: clientes }, { data: usuarios }] =
    await Promise.all([
      supabase
        .from('cap_manager_tarefas')
        .select(
          '*, campanha:cap_manager_campanhas(id, nome), cliente:cap_manager_clientes(id, nome), responsavel:cap_manager_usuarios(id, nome)'
        )
        .order('ordem', { ascending: true }),
      supabase.from('cap_manager_campanhas').select('id, nome').order('nome'),
      supabase.from('cap_manager_clientes').select('id, nome').eq('ativo', true).order('nome'),
      supabase.from('cap_manager_usuarios').select('id, nome').eq('ativo', true).order('nome'),
    ])

  return (
    <div>
      <Header title="Tarefas" subtitle="Gerencie suas tarefas com Kanban" />
      <div className="p-4 lg:p-8">
        <TarefasKanban
          tarefas={tarefas || []}
          campanhas={campanhas || []}
          clientes={clientes || []}
          usuarios={usuarios || []}
        />
      </div>
    </div>
  )
}
