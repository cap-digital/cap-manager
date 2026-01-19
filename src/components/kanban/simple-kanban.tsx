'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, GripVertical, Calendar, User, Folder, Trash2, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ViewToggle, ViewMode } from './view-toggle'
import { ListView } from './list-view'
import { TableView } from './table-view'
import { TaskDetailsLayout } from '@/components/task-view/task-details-layout'
import { CardKanban, AreaKanban } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface SimpleKanbanProps {
  area: string
  areaLabel: string
  cards: CardKanban[]
  projetos: { id: number; nome: string }[]
  clientes: { id: number; nome: string }[]
  usuarios: { id: number; nome: string }[]
  usuarioLogadoId: number
}

// Colunas simples para Inteligência
const columns = [
  { id: 'backlog', label: 'Backlog', color: 'bg-slate-500' },
  { id: 'para_fazer', label: 'Para Fazer', color: 'bg-blue-500' },
  { id: 'em_execucao', label: 'Em Execucao', color: 'bg-yellow-500' },
  { id: 'finalizado', label: 'Finalizado', color: 'bg-green-500' },
]

const prioridadeColors = {
  baixa: 'bg-slate-100 text-slate-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
}

function SortableCard({
  card,
  projetos,
  clientes,
  usuarios,
  onEdit,
  onView,
  onDelete,
}: {
  card: CardKanban
  projetos: { id: number; nome: string }[]
  clientes: { id: number; nome: string }[]
  usuarios: { id: number; nome: string }[]
  onEdit: (card: CardKanban) => void
  onView: (card: CardKanban) => void
  onDelete: (id: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const projeto = projetos.find(p => p.id === card.projeto_id)
  const cliente = clientes.find(c => c.id === card.cliente_id)
  const responsavel = usuarios.find(u => u.id === card.trader_id)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card border rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-all',
        isDragging && 'opacity-50'
      )}
      onClick={() => onView(card)}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{card.titulo}</h4>
            {card.descricao && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {card.descricao}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(card)
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(card.id)
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Badge className={prioridadeColors[card.prioridade]} variant="secondary">
          {card.prioridade}
        </Badge>
        {projeto && (
          <Badge variant="outline" className="text-xs">
            <Folder className="h-3 w-3 mr-1" />
            {projeto.nome}
          </Badge>
        )}
        {cliente && (
          <Badge variant="outline" className="text-xs">
            {cliente.nome}
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
        {responsavel && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Responsável: {responsavel.nome}
          </span>
        )}
        {card.data_vencimento && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(card.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  )
}

// Componente para tornar coluna droppable
function DroppableColumn({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'space-y-3 min-h-[200px] transition-colors rounded-lg p-2 -m-2',
        isOver && 'bg-primary/10'
      )}
    >
      {children}
    </div>
  )
}

export function SimpleKanban({
  area,
  areaLabel,
  cards: initialCards,
  projetos,
  clientes,
  usuarios,
  usuarioLogadoId,
}: SimpleKanbanProps) {
  const { toast } = useToast()
  const [cards, setCards] = useState<CardKanban[]>(initialCards)
  const [activeCard, setActiveCard] = useState<CardKanban | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CardKanban | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    projeto_id: '',
    cliente_id: '',
    trader_id: '',
    data_vencimento: '',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    setCards(initialCards)
  }, [initialCards])

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find(c => c.id === event.active.id)
    if (card) setActiveCard(card)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeCard = cards.find(c => c.id === active.id)
    if (!activeCard) return

    const overId = over.id.toString()
    const isColumn = columns.some(col => col.id === overId)

    if (isColumn && activeCard.status !== overId) {
      // Movendo para outra coluna
      const updatedCards = cards.map(c =>
        c.id === activeCard.id ? { ...c, status: overId } : c
      )
      setCards(updatedCards)

      await fetch(`/api/cards-kanban?id=${activeCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: overId }),
      })
    }
  }

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      toast({
        title: 'Erro',
        description: 'O título é obrigatório.',
        variant: 'destructive',
      })
      return
    }

    const cardData = {
      titulo: formData.titulo,
      descricao: formData.descricao || null,
      area: area as AreaKanban,
      status: editingCard?.status || 'backlog',
      prioridade: formData.prioridade,
      projeto_id: formData.projeto_id ? parseInt(formData.projeto_id) : null,
      cliente_id: formData.cliente_id ? parseInt(formData.cliente_id) : null,
      trader_id: formData.trader_id ? parseInt(formData.trader_id) : null,
      data_vencimento: formData.data_vencimento || null,
    }

    try {
      if (editingCard) {
        const response = await fetch(`/api/cards-kanban?id=${editingCard.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cardData),
        })

        if (!response.ok) {
          throw new Error('Erro ao atualizar task')
        }

        const updated = await response.json()
        setCards(cards.map(c => c.id === editingCard.id ? {
          ...c,
          ...cardData,
          updated_at: new Date().toISOString(),
        } : c))
        setIsEditMode(false)

        toast({
          title: 'Sucesso',
          description: 'Task atualizada com sucesso!',
        })
      } else {
        const response = await fetch('/api/cards-kanban', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cardData),
        })

        if (!response.ok) {
          throw new Error('Erro ao criar task')
        }

        const newCard = await response.json()

        if (!newCard.id) {
          throw new Error('Resposta inválida do servidor')
        }

        setCards(prevCards => [...prevCards, {
          id: newCard.id,
          titulo: newCard.titulo,
          descricao: newCard.descricao,
          area: newCard.area,
          status: newCard.status,
          prioridade: newCard.prioridade,
          cliente_id: newCard.cliente_id,
          projeto_id: newCard.projeto_id,
          trader_id: newCard.trader_id,
          responsavel_relatorio_id: newCard.responsavel_relatorio_id,
          responsavel_revisao_id: newCard.responsavel_revisao_id,
          revisao_relatorio_ok: newCard.revisao_relatorio_ok,
          link_relatorio: newCard.link_relatorio,
          data_vencimento: newCard.data_vencimento?.split('T')[0] || null,
          data_inicio: newCard.data_inicio?.split('T')[0] || null,
          observador_id: newCard.observador_id,
          ordem: newCard.ordem,
          created_at: newCard.created_at,
          updated_at: newCard.updated_at,
        }])

        toast({
          title: 'Sucesso',
          description: 'Task criada com sucesso!',
        })
      }

      resetForm()
    } catch (error) {
      console.error('Erro ao salvar task:', error)
      toast({
        title: 'Erro',
        description: editingCard ? 'Erro ao atualizar task. Tente novamente.' : 'Erro ao criar task. Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (card: CardKanban) => {
    setEditingCard(card)
    setFormData({
      titulo: card.titulo,
      descricao: card.descricao || '',
      prioridade: card.prioridade,
      projeto_id: card.projeto_id?.toString() || '',
      cliente_id: card.cliente_id?.toString() || '',
      trader_id: card.trader_id?.toString() || '',
      data_vencimento: card.data_vencimento || '',
    })
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este card?')) return

    try {
      const response = await fetch(`/api/cards-kanban?id=${id}`, { method: 'DELETE' })

      if (!response.ok) {
        throw new Error('Erro ao excluir task')
      }

      setCards(cards.filter(c => c.id !== id))

      toast({
        title: 'Sucesso',
        description: 'Task excluída com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao excluir task:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao excluir task. Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      prioridade: 'media',
      projeto_id: '',
      cliente_id: '',
      trader_id: '',
      data_vencimento: '',
    })
    setEditingCard(null)
    setIsEditMode(false)
    setIsDialogOpen(false)
  }

  const getColumnCards = (columnId: string) => {
    return cards.filter(c => c.status === columnId).sort((a, b) => a.ordem - b.ordem)
  }

  const handleStatusChange = async (cardId: number, newStatus: string) => {
    const card = cards.find(c => c.id === cardId)
    if (!card || card.status === newStatus) return

    const updatedCards = cards.map(c =>
      c.id === cardId ? { ...c, status: newStatus } : c
    )
    setCards(updatedCards)

    await fetch(`/api/cards-kanban?id=${cardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm()
                setIsEditMode(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Task
              </Button>
            </DialogTrigger>
            <DialogContent className={cn(
              "p-0 gap-0 overflow-hidden",
              !isEditMode && "max-w-[1200px] h-[85vh] bg-transparent border-0 shadow-none sm:max-w-[1200px]"
            )}>
              {!isEditMode && editingCard ? (
                <TaskDetailsLayout
                  card={editingCard}
                  projeto={projetos.find(p => p.id === editingCard.projeto_id) ? {
                    ...projetos.find(p => p.id === editingCard.projeto_id)!,
                    tipo_cobranca: 'td' // Default fallback since simple kanban doesn't have this prop usually
                  } : undefined}
                  traderNome={usuarios.find(u => u.id === editingCard.trader_id)?.nome}
                  usuarios={usuarios}
                  usuarioLogadoId={usuarioLogadoId}
                  onClose={() => setIsDialogOpen(false)}
                  onEdit={() => handleEdit(editingCard)}
                />
              ) : (
                <div className="bg-background w-full h-full md:max-w-2xl md:max-h-[90vh] md:h-auto overflow-y-auto p-6 rounded-lg shadow-lg mx-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCard ? 'Editar Task' : 'Nova Task'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Titulo *</Label>
                      <Input
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        placeholder="Titulo da task"
                      />
                    </div>
                    <div>
                      <Label>Descricao</Label>
                      <Textarea
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        placeholder="Descricao da task"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Prioridade</Label>
                        <Select
                          value={formData.prioridade}
                          onValueChange={(v) => setFormData({ ...formData, prioridade: v as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Data Vencimento</Label>
                        <Input
                          type="date"
                          value={formData.data_vencimento}
                          onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Projeto</Label>
                      <Select
                        value={formData.projeto_id}
                        onValueChange={(v) => setFormData({ ...formData, projeto_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o projeto" />
                        </SelectTrigger>
                        <SelectContent>
                          {projetos.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cliente</Label>
                      <Select
                        value={formData.cliente_id}
                        onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Responsavel</Label>
                      <Select
                        value={formData.trader_id}
                        onValueChange={(v) => setFormData({ ...formData, trader_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsavel" />
                        </SelectTrigger>
                        <SelectContent>
                          {usuarios.map((u) => (
                            <SelectItem key={u.id} value={u.id.toString()}>
                              {u.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={resetForm} type="button">
                        Cancelar
                      </Button>
                      <Button onClick={handleSubmit} type="button">
                        {editingCard ? 'Salvar' : 'Criar'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Visualizacao em Lista */}
      {viewMode === 'list' && (
        <ListView
          cards={cards}
          columns={columns}
          projetos={projetos}
          usuarios={usuarios}
          onEdit={(card) => {
            const fullCard = cards.find(c => c.id === card.id)
            if (fullCard) {
              // For listView edit click, we want to open VIEW mode first (details layout)
              setEditingCard(fullCard)
              setIsEditMode(false)
              setIsDialogOpen(true)
            }
          }}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Visualizacao em Tabela */}
      {viewMode === 'table' && (
        <TableView
          cards={cards}
          columns={columns}
          projetos={projetos}
          clientes={clientes}
          usuarios={usuarios}
          onEdit={(card) => {
            const fullCard = cards.find(c => c.id === card.id)
            if (fullCard) {
              setEditingCard(fullCard)
              setIsEditMode(false)
              setIsDialogOpen(true)
            }
          }}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Visualizacao Kanban */}
      {viewMode === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <ScrollArea className="w-full">
            <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
              {columns.map((column) => (
                <Card key={column.id} className="min-h-[600px] w-[320px] shrink-0 bg-muted/30 border-muted">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <div className={cn('w-3 h-3 rounded-full shadow-sm', column.color)} />
                      <span className="truncate flex-1">{column.label}</span>
                      <Badge variant="secondary" className="ml-auto shrink-0 text-xs font-medium">
                        {getColumnCards(column.id).length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <DroppableColumn id={column.id}>
                      <SortableContext
                        items={getColumnCards(column.id).map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {getColumnCards(column.id).map((card) => (
                          <SortableCard
                            key={card.id}
                            card={card}
                            projetos={projetos}
                            clientes={clientes}
                            usuarios={usuarios}
                            onView={(card) => {
                              setEditingCard(card)
                              setIsEditMode(false)
                              setIsDialogOpen(true)
                            }}
                            onEdit={(card) => handleEdit(card)}
                            onDelete={handleDelete}
                          />
                        ))}
                      </SortableContext>
                      {getColumnCards(column.id).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60">
                          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                            <Plus className="h-5 w-5" />
                          </div>
                          <p className="text-sm">Arraste cards aqui</p>
                        </div>
                      )}
                    </DroppableColumn>
                  </CardContent>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <DragOverlay>
            {activeCard && (
              <div className="bg-card border-2 border-primary/50 rounded-lg p-4 shadow-2xl rotate-3 scale-105 w-[320px]">
                <h4 className="font-semibold text-sm">{activeCard.titulo}</h4>
                {activeCard.descricao && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activeCard.descricao}</p>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
