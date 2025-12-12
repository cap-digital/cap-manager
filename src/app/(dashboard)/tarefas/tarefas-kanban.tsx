'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  User,
  Loader2,
  GripVertical,
} from 'lucide-react'
import type { TarefaStatus, TarefaPrioridade } from '@/types'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface SimplifiedTarefa {
  id: string
  titulo: string
  descricao: string | null
  status: TarefaStatus
  prioridade: TarefaPrioridade
  campanha_id: string | null
  campanha: { id: string; nome: string } | null
  cliente_id: string | null
  cliente: { id: string; nome: string } | null
  responsavel_id: string | null
  responsavel: { id: string; nome: string } | null
  data_vencimento: string | null
  ordem: number
  created_at: string
  updated_at: string
}

interface TarefasKanbanProps {
  tarefas: SimplifiedTarefa[]
  campanhas: { id: string; nome: string }[]
  clientes: { id: string; nome: string }[]
  usuarios: { id: string; nome: string }[]
}

const columns: { id: TarefaStatus; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-100' },
  { id: 'todo', title: 'A Fazer', color: 'bg-blue-100' },
  { id: 'doing', title: 'Em Progresso', color: 'bg-yellow-100' },
  { id: 'review', title: 'Revisão', color: 'bg-purple-100' },
  { id: 'done', title: 'Concluído', color: 'bg-green-100' },
]

const prioridadeOptions: { value: TarefaPrioridade; label: string; color: string }[] = [
  { value: 'baixa', label: 'Baixa', color: 'secondary' },
  { value: 'media', label: 'Média', color: 'default' },
  { value: 'alta', label: 'Alta', color: 'warning' },
  { value: 'urgente', label: 'Urgente', color: 'destructive' },
]

function TarefaCard({
  tarefa,
  onEdit,
  onDelete,
}: {
  tarefa: SimplifiedTarefa
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tarefa.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const prioridade = prioridadeOptions.find(p => p.value === tarefa.prioridade)

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={cn('group cursor-grab active:cursor-grabbing', isDragging && 'shadow-lg')}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div {...listeners} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-sm line-clamp-2">{tarefa.titulo}</h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="h-3 w-3 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="h-3 w-3 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {tarefa.descricao && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {tarefa.descricao}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={prioridade?.color as 'default' | 'secondary' | 'destructive'} className="text-xs">
                  {prioridade?.label}
                </Badge>

                {tarefa.campanha && (
                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                    {tarefa.campanha.nome}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                {tarefa.responsavel && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-[80px]">{tarefa.responsavel.nome}</span>
                  </div>
                )}
                {tarefa.data_vencimento && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(tarefa.data_vencimento)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function TarefasKanban({
  tarefas: initialTarefas,
  campanhas,
  clientes,
  usuarios,
}: TarefasKanbanProps) {
  const [tarefas, setTarefas] = useState(initialTarefas)
  const [isOpen, setIsOpen] = useState(false)
  const [editingTarefa, setEditingTarefa] = useState<SimplifiedTarefa | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTarefa, setActiveTarefa] = useState<SimplifiedTarefa | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    status: 'todo' as TarefaStatus,
    prioridade: 'media' as TarefaPrioridade,
    campanha_id: '',
    cliente_id: '',
    responsavel_id: '',
    data_vencimento: '',
  })
  const router = useRouter()
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const tarefasByStatus = useMemo(() => {
    const grouped: Record<TarefaStatus, typeof tarefas> = {
      backlog: [],
      todo: [],
      doing: [],
      review: [],
      done: [],
    }

    tarefas.forEach(tarefa => {
      grouped[tarefa.status].push(tarefa)
    })

    return grouped
  }, [tarefas])

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      status: 'todo',
      prioridade: 'media',
      campanha_id: '',
      cliente_id: '',
      responsavel_id: '',
      data_vencimento: '',
    })
    setEditingTarefa(null)
  }

  const openEditDialog = (tarefa: SimplifiedTarefa) => {
    setEditingTarefa(tarefa)
    setFormData({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao || '',
      status: tarefa.status,
      prioridade: tarefa.prioridade,
      campanha_id: tarefa.campanha_id || '',
      cliente_id: tarefa.cliente_id || '',
      responsavel_id: tarefa.responsavel_id || '',
      data_vencimento: tarefa.data_vencimento || '',
    })
    setIsOpen(true)
  }

  const openCreateDialog = (status: TarefaStatus) => {
    resetForm()
    setFormData(prev => ({ ...prev, status }))
    setIsOpen(true)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const tarefa = tarefas.find(t => t.id === active.id)
    setActiveTarefa(tarefa || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTarefa(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Verificar se é uma coluna ou uma tarefa
    const isColumn = columns.some(col => col.id === overId)
    const newStatus = isColumn
      ? (overId as TarefaStatus)
      : tarefas.find(t => t.id === overId)?.status

    if (!newStatus) return

    const tarefa = tarefas.find(t => t.id === activeId)
    if (!tarefa || tarefa.status === newStatus) return

    // Atualizar localmente primeiro
    setTarefas(prev =>
      prev.map(t => (t.id === activeId ? { ...t, status: newStatus } : t))
    )

    // Atualizar no banco via API
    try {
      const response = await fetch('/api/tarefas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeId, status: newStatus }),
      })

      if (!response.ok) throw new Error('Erro ao mover tarefa')
    } catch (error) {
      // Reverter em caso de erro
      setTarefas(prev =>
        prev.map(t => (t.id === activeId ? tarefa : t))
      )
      toast({
        variant: 'destructive',
        title: 'Erro ao mover tarefa',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const payload = {
      titulo: formData.titulo,
      descricao: formData.descricao || null,
      status: formData.status,
      prioridade: formData.prioridade,
      campanha_id: formData.campanha_id || null,
      cliente_id: formData.cliente_id || null,
      responsavel_id: formData.responsavel_id || null,
      data_vencimento: formData.data_vencimento || null,
      ordem: tarefasByStatus[formData.status].length,
    }

    try {
      if (editingTarefa) {
        const response = await fetch('/api/tarefas', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTarefa.id, ...payload }),
        })

        if (!response.ok) throw new Error('Erro ao atualizar tarefa')

        toast({ title: 'Tarefa atualizada com sucesso!' })
      } else {
        const response = await fetch('/api/tarefas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) throw new Error('Erro ao criar tarefa')

        toast({ title: 'Tarefa criada com sucesso!' })
      }

      setIsOpen(false)
      resetForm()
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro'
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return

    try {
      const response = await fetch(`/api/tarefas?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao excluir tarefa')

      setTarefas(prev => prev.filter(t => t.id !== id))
      toast({ title: 'Tarefa excluída com sucesso!' })
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro'
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: errorMessage,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog
          open={isOpen}
          onOpenChange={open => {
            setIsOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTarefa ? 'Editar Tarefa' : 'Nova Tarefa'}
                </DialogTitle>
                <DialogDescription>
                  {editingTarefa
                    ? 'Atualize os dados da tarefa'
                    : 'Preencha os dados para criar uma nova tarefa'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    placeholder="Título da tarefa"
                    value={formData.titulo}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, titulo: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Descrição detalhada..."
                    value={formData.descricao}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, descricao: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, status: value as TarefaStatus }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prioridade">Prioridade</Label>
                    <Select
                      value={formData.prioridade}
                      onValueChange={value =>
                        setFormData(prev => ({
                          ...prev,
                          prioridade: value as TarefaPrioridade,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {prioridadeOptions.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel_id">Responsável</Label>
                  <Select
                    value={formData.responsavel_id}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, responsavel_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campanha_id">Campanha (opcional)</Label>
                  <Select
                    value={formData.campanha_id}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, campanha_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {campanhas.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                  <Input
                    id="data_vencimento"
                    type="date"
                    value={formData.data_vencimento}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        data_vencimento: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTarefa ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {columns.map(column => (
            <div key={column.id} className="min-w-[280px]">
              <Card className={cn('h-full', column.color)}>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{column.title}</span>
                    <Badge variant="secondary" className="ml-2">
                      {tarefasByStatus[column.id].length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-2 min-h-[200px]">
                  <SortableContext
                    items={tarefasByStatus[column.id].map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {tarefasByStatus[column.id].map(tarefa => (
                      <TarefaCard
                        key={tarefa.id}
                        tarefa={tarefa}
                        onEdit={() => openEditDialog(tarefa)}
                        onDelete={() => handleDelete(tarefa.id)}
                      />
                    ))}
                  </SortableContext>

                  <Button
                    variant="ghost"
                    className="w-full border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40"
                    onClick={() => openCreateDialog(column.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTarefa && (
            <Card className="shadow-lg rotate-3">
              <CardContent className="p-3">
                <h4 className="font-medium text-sm">{activeTarefa.titulo}</h4>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
