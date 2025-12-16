import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { TarefasKanban } from './tarefas-kanban'

export default async function TarefasPage() {
  const [tarefas, projetos, clientes, usuarios] = await Promise.all([
    prisma.tarefa.findMany({
      include: {
        projeto: { select: { id: true, nome: true } },
        cliente: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true } },
      },
      orderBy: { ordem: 'asc' },
    }),
    prisma.projeto.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.cliente.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.usuario.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  // Transform data to match expected types (snake_case for frontend compatibility)
  const tarefasFormatted = tarefas.map(tarefa => ({
    id: tarefa.id,
    titulo: tarefa.titulo,
    descricao: tarefa.descricao,
    status: tarefa.status as 'backlog' | 'todo' | 'doing' | 'review' | 'done',
    prioridade: tarefa.prioridade as 'baixa' | 'media' | 'alta' | 'urgente',
    projeto_id: tarefa.projetoId,
    projeto: tarefa.projeto,
    cliente_id: tarefa.clienteId,
    cliente: tarefa.cliente,
    responsavel_id: tarefa.responsavelId,
    responsavel: tarefa.responsavel,
    data_vencimento: tarefa.dataVencimento?.toISOString().split('T')[0] || null,
    ordem: tarefa.ordem,
    created_at: tarefa.createdAt.toISOString(),
    updated_at: tarefa.updatedAt.toISOString(),
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
