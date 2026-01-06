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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
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
import {
  Plus,
  GripVertical,
  Calendar,
  User,
  Folder,
  Trash2,
  Edit,
  Link2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ViewToggle, ViewMode } from '@/components/kanban/view-toggle'
import { ListView } from '@/components/kanban/list-view'
import { TableView } from '@/components/kanban/table-view'

interface CardKanban {
  id: number
  titulo: string
  descricao: string | null
  area: string
  status: string
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  cliente_id: number | null
  projeto_id: number | null
  trader_id: number | null
  responsavel_relatorio_id: number | null
  responsavel_revisao_id: number | null
  revisao_relatorio_ok: boolean
  link_relatorio: string | null
  data_vencimento: string | null
  ordem: number
  created_at: string
  updated_at: string
}

interface Projeto {
  id: number
  nome: string
  tipo_cobranca: string
  data_fim: string | null
  revisao_final_ok: boolean
  cliente: { id: number; nome: string } | null
  trader: { id: number; nome: string } | null
}

interface GestaoTrafegoKanbanProps {
  cards: CardKanban[]
  projetos: Projeto[]
  clientes: { id: number; nome: string }[]
  usuarios: { id: number; nome: string }[]
}

// Colunas do fluxo Gestão de Tráfego
const columns = [
  { id: 'backlog', label: 'Backlog', color: 'bg-slate-500' },
  { id: 'para_fazer', label: 'Para Fazer', color: 'bg-blue-500' },
  { id: 'em_execucao', label: 'Em Execucao', color: 'bg-yellow-500' },
  { id: 'projeto_finalizado', label: 'Projeto Finalizado', color: 'bg-purple-500' },
  { id: 'relatorio_a_fazer', label: 'Relatorio A Fazer', color: 'bg-orange-500' },
  { id: 'relatorio_em_revisao', label: 'Relatorio em Revisao', color: 'bg-pink-500' },
  { id: 'relatorio_finalizado', label: 'Relatorio Finalizado', color: 'bg-green-500' },
]

const prioridadeColors = {
  baixa: 'bg-slate-100 text-slate-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
}

import { SubtaskList } from './subtask-list'

function SortableCard({
  card,
  projetos,
  usuarios,
  onEdit,
  onView,
  onDelete,
  onConcluirProjeto,
}: {
  card: CardKanban
  projetos: Projeto[]
  usuarios: { id: number; nome: string }[]
  onEdit: (card: CardKanban) => void
  onView: (card: CardKanban) => void
  onDelete: (id: number) => void
  onConcluirProjeto: (card: CardKanban) => void
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
  const trader = usuarios.find(u => u.id === card.trader_id)
  const responsavelRelatorio = usuarios.find(u => u.id === card.responsavel_relatorio_id)
  const responsavelRevisao = usuarios.find(u => u.id === card.responsavel_revisao_id)

  const isRelatorioFinalizado = card.status === 'relatorio_finalizado'

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
          <Link
            href={`/projetos/${projeto.id}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:opacity-80 transition-opacity"
          >
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent">
              <Folder className="h-3 w-3 mr-1" />
              {projeto.nome}
              {projeto.tipo_cobranca === 'fee' && (
                <span className="ml-1 text-purple-600">(FEE)</span>
              )}
            </Badge>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
        {trader && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Trader: {trader.nome}
          </span>
        )}
        {responsavelRelatorio && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3 text-orange-500" />
            Relatorio: {responsavelRelatorio.nome}
          </span>
        )}
        {responsavelRevisao && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3 text-pink-500" />
            Revisao: {responsavelRevisao.nome}
          </span>
        )}
        {card.data_vencimento && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(card.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
          </span>
        )}
        {card.link_relatorio && (
          <span className="flex items-center gap-1 text-green-600">
            <Link2 className="h-3 w-3" />
            Link do relatorio
          </span>
        )}
        {card.revisao_relatorio_ok && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Revisao aprovada
          </span>
        )}
      </div>

      {/* Botão de ação para relatório finalizado */}
      {isRelatorioFinalizado && card.link_relatorio && card.revisao_relatorio_ok && (
        <div className="flex gap-2 mt-3 pt-2 border-t">
          <Button
            size="sm"
            variant="default"
            className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700"
            onClick={(e) => {
              e.stopPropagation()
              onConcluirProjeto(card)
            }}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Concluir Projeto
          </Button>
        </div>
      )}
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

export function GestaoTrafegoKanban({
  cards: initialCards,
  projetos,
  clientes,
  usuarios,
}: GestaoTrafegoKanbanProps) {
  const router = useRouter()
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
    responsavel_relatorio_id: '',
    responsavel_revisao_id: '',
    revisao_relatorio_ok: false,
    link_relatorio: '',
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

    // Se soltar sobre um card, encontrar a coluna desse card
    let targetColumnId = overId
    if (!isColumn) {
      const overCard = cards.find(c => c.id === Number(overId))
      if (overCard) {
        targetColumnId = overCard.status
      }
    }

    const isTargetColumn = columns.some(col => col.id === targetColumnId)

    if (isTargetColumn && activeCard.status !== targetColumnId) {
      // Validações de fluxo
      // Para mover para "em_execucao", precisa ter projeto e trader
      if (targetColumnId === 'em_execucao' && (!activeCard.projeto_id || !activeCard.trader_id)) {
        alert('Para mover para Em Execucao, vincule um Projeto e um Trader primeiro.')
        return
      }

      // Para mover para "relatorio_a_fazer", precisa ter responsável de relatório
      if (targetColumnId === 'relatorio_a_fazer' && !activeCard.responsavel_relatorio_id) {
        alert('Para mover para Relatorio A Fazer, defina o Responsavel pelo Relatorio primeiro.')
        return
      }

      // Para mover para "relatorio_em_revisao", precisa ter responsável de revisão
      if (targetColumnId === 'relatorio_em_revisao' && !activeCard.responsavel_revisao_id) {
        alert('Para mover para Relatorio em Revisao, defina o Responsavel pela Revisao primeiro.')
        return
      }

      // Para mover para "relatorio_finalizado", precisa ter check de revisão e link
      if (targetColumnId === 'relatorio_finalizado') {
        if (!activeCard.revisao_relatorio_ok) {
          alert('Para finalizar o relatorio, o revisor precisa aprovar primeiro.')
          return
        }
        if (!activeCard.link_relatorio) {
          alert('Para finalizar o relatorio, adicione o link do relatorio primeiro.')
          return
        }
      }

      // Movendo para outra coluna
      const updatedCards = cards.map(c =>
        c.id === activeCard.id ? { ...c, status: targetColumnId } : c
      )
      setCards(updatedCards)

      await fetch(`/api/cards-kanban?id=${activeCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetColumnId }),
      })
    }
  }

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) return

    const cardData = {
      titulo: formData.titulo,
      descricao: formData.descricao || null,
      area: 'gestao_trafego',
      status: editingCard?.status || 'backlog',
      prioridade: formData.prioridade,
      projeto_id: formData.projeto_id ? parseInt(formData.projeto_id) : null,
      cliente_id: formData.cliente_id ? parseInt(formData.cliente_id) : null,
      trader_id: formData.trader_id ? parseInt(formData.trader_id) : null,
      responsavel_relatorio_id: formData.responsavel_relatorio_id ? parseInt(formData.responsavel_relatorio_id) : null,
      responsavel_revisao_id: formData.responsavel_revisao_id ? parseInt(formData.responsavel_revisao_id) : null,
      revisao_relatorio_ok: formData.revisao_relatorio_ok,
      link_relatorio: formData.link_relatorio || null,
      data_vencimento: formData.data_vencimento || null,
    }

    if (editingCard) {
      const response = await fetch(`/api/cards-kanban?id=${editingCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      })
      const updated = await response.json()
      setCards(cards.map(c => c.id === editingCard.id ? {
        ...c,
        ...cardData,
        updated_at: new Date().toISOString(),
      } : c))

      // If saving in edit mode, go back to view mode if it was editing an existing card
      setIsEditMode(false)
    } else {
      const response = await fetch('/api/cards-kanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      })
      const newCard = await response.json()
      setCards([...cards, {
        id: newCard.id,
        titulo: newCard.titulo,
        descricao: newCard.descricao,
        area: newCard.area,
        status: newCard.status,
        prioridade: newCard.prioridade,
        cliente_id: newCard.clienteId,
        projeto_id: newCard.projetoId,
        trader_id: newCard.traderId,
        responsavel_relatorio_id: newCard.responsavelRelatorioId,
        responsavel_revisao_id: newCard.responsavelRevisaoId,
        revisao_relatorio_ok: newCard.revisaoRelatorioOk,
        link_relatorio: newCard.linkRelatorio,
        data_vencimento: newCard.dataVencimento?.split('T')[0] || null,
        ordem: newCard.ordem,
        created_at: newCard.createdAt,
        updated_at: newCard.updatedAt,
      }])
    }

    resetForm()
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
      responsavel_relatorio_id: card.responsavel_relatorio_id?.toString() || '',
      responsavel_revisao_id: card.responsavel_revisao_id?.toString() || '',
      revisao_relatorio_ok: card.revisao_relatorio_ok,
      link_relatorio: card.link_relatorio || '',
      data_vencimento: card.data_vencimento || '',
    })
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este card?')) return

    await fetch(`/api/cards-kanban?id=${id}`, { method: 'DELETE' })
    setCards(cards.filter(c => c.id !== id))
  }

  const handleConcluirProjeto = async (card: CardKanban) => {
    try {
      // 1. Criar card no faturamento
      const faturamentoResponse = await fetch('/api/cards-kanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: card.titulo,
          descricao: card.descricao,
          area: 'faturamento',
          status: 'backlog',
          prioridade: card.prioridade,
          projeto_id: card.projeto_id,
          cliente_id: card.cliente_id,
          trader_id: card.trader_id,
          link_relatorio: card.link_relatorio,
        }),
      })
      const faturamentoCard = await faturamentoResponse.json()

      // 2. Criar card em projetos concluídos com link para o card de faturamento
      await fetch('/api/cards-kanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: card.titulo,
          descricao: card.descricao,
          area: 'projetos_concluidos',
          status: 'aguardando_faturamento',
          prioridade: card.prioridade,
          projeto_id: card.projeto_id,
          cliente_id: card.cliente_id,
          trader_id: card.trader_id,
          link_relatorio: card.link_relatorio,
          faturamento_card_id: faturamentoCard.id,
        }),
      })

      // 3. Remover do gestão de tráfego
      await fetch(`/api/cards-kanban?id=${card.id}`, { method: 'DELETE' })
      setCards(cards.filter(c => c.id !== card.id))

      alert('Projeto concluído! Card enviado para Faturamento e adicionado aos Projetos Concluídos.')
      router.refresh()
    } catch (error) {
      console.error('Erro ao concluir projeto:', error)
      alert('Erro ao concluir projeto. Tente novamente.')
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
      responsavel_relatorio_id: '',
      responsavel_revisao_id: '',
      revisao_relatorio_ok: false,
      link_relatorio: '',
      data_vencimento: '',
    })
    setEditingCard(null)
    setIsEditMode(false)
    setIsDialogOpen(false)
  }

  const getColumnCards = (columnId: string) => {
    return cards.filter(c => c.status === columnId).sort((a, b) => a.ordem - b.ordem)
  }

  // Campos visíveis baseado no status atual
  const showRelatorioFields = editingCard && ['relatorio_a_fazer', 'relatorio_em_revisao', 'relatorio_finalizado'].includes(editingCard.status)
  const showRevisaoFields = editingCard && ['relatorio_em_revisao', 'relatorio_finalizado'].includes(editingCard.status)

  // Handler para mudança de status via lista/tabela
  const handleStatusChange = async (cardId: number, newStatus: string) => {
    const card = cards.find(c => c.id === cardId)
    if (!card || card.status === newStatus) return

    // Aplicar as mesmas validações do drag
    const projeto = projetos.find(p => p.id === card.projeto_id)

    if (newStatus === 'em_execucao' && (!card.projeto_id || !card.trader_id)) {
      alert('Para mover para Em Execucao, vincule um Projeto e um Trader primeiro.')
      return
    }

    if (newStatus === 'relatorio_a_fazer' && !card.responsavel_relatorio_id) {
      alert('Para mover para Relatorio A Fazer, defina o Responsavel pelo Relatorio primeiro.')
      return
    }

    if (newStatus === 'relatorio_em_revisao' && !card.responsavel_revisao_id) {
      alert('Para mover para Relatorio em Revisao, defina o Responsavel pela Revisao primeiro.')
      return
    }

    if (newStatus === 'relatorio_finalizado') {
      if (!card.revisao_relatorio_ok) {
        alert('Para finalizar o relatorio, o revisor precisa aprovar primeiro.')
        return
      }
      if (!card.link_relatorio) {
        alert('Para finalizar o relatorio, adicione o link do relatorio primeiro.')
        return
      }
    }

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

  // Cards formatados para visualização lista/tabela
  const cardsForView = cards.map(c => ({
    id: c.id,
    titulo: c.titulo,
    descricao: c.descricao,
    status: c.status,
    prioridade: c.prioridade,
    projeto_id: c.projeto_id,
    cliente_id: c.cliente_id,
    trader_id: c.trader_id,
    data_vencimento: c.data_vencimento,
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            Fluxo: Backlog → Para Fazer → Em Execucao → Projeto Finalizado → Relatorio A Fazer → Revisao → Finalizado
          </p>
        </div>
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              {!isEditMode && editingCard ? (
                <div className="space-y-6">
                  <DialogHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <DialogTitle className="text-xl">{editingCard.titulo}</DialogTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={prioridadeColors[editingCard.prioridade]}>{editingCard.prioridade}</Badge>
                          <Badge variant="outline">{columns.find(c => c.id === editingCard.status)?.label}</Badge>
                        </div>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {editingCard.descricao && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Descricao</h4>
                          <p className="text-sm whitespace-pre-wrap">{editingCard.descricao}</p>
                        </div>
                      )}

                      {(editingCard.projeto_id || editingCard.cliente_id) && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Vinculacao</h4>
                          <div className="flex flex-col gap-1">
                            {editingCard.projeto_id && (
                              <div className="flex items-center gap-2 text-sm">
                                <Folder className="h-4 w-4 text-muted-foreground" />
                                <span>{projetos.find(p => p.id === editingCard.projeto_id)?.nome}</span>
                              </div>
                            )}
                            {editingCard.trader_id && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{usuarios.find(u => u.id === editingCard.trader_id)?.nome}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {editingCard.data_vencimento && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-muted-foreground">Prazo</h4>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(editingCard.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Subtarefas
                      </h4>
                      <SubtaskList tarefaId={editingCard.id} usuarios={usuarios} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="destructive" onClick={() => handleDelete(editingCard.id)}>
                      Excluir
                    </Button>
                    <Button onClick={() => setIsEditMode(true)}>
                      Editar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
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
                        <Label>Prazo</Label>
                        <Input
                          type="date"
                          value={formData.data_vencimento}
                          onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Vinculacao</h4>
                      <div className="grid grid-cols-2 gap-4">
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
                                  {p.nome} {p.tipo_cobranca === 'fee' ? '(FEE)' : '(TD)'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Trader</Label>
                          <Select
                            value={formData.trader_id}
                            onValueChange={(v) => setFormData({ ...formData, trader_id: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o trader" />
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
                      </div>
                    </div>

                    {/* Campos de Relatório - sempre visíveis na edição para facilitar */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Relatorio</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Responsavel pelo Relatorio</Label>
                          <Select
                            value={formData.responsavel_relatorio_id}
                            onValueChange={(v) => setFormData({ ...formData, responsavel_relatorio_id: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Quem fara o relatorio" />
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
                        <div>
                          <Label>Responsavel pela Revisao</Label>
                          <Select
                            value={formData.responsavel_revisao_id}
                            onValueChange={(v) => setFormData({ ...formData, responsavel_revisao_id: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Quem revisara" />
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
                      </div>
                      <div className="mt-4">
                        <Label>Link do Relatorio</Label>
                        <Input
                          value={formData.link_relatorio}
                          onChange={(e) => setFormData({ ...formData, link_relatorio: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-4">
                        <Checkbox
                          id="revisao_ok"
                          checked={formData.revisao_relatorio_ok}
                          onCheckedChange={(c) => setFormData({ ...formData, revisao_relatorio_ok: !!c })}
                        />
                        <Label htmlFor="revisao_ok" className="cursor-pointer">
                          Revisao do relatorio aprovada
                        </Label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => editingCard ? setIsEditMode(false) : setIsDialogOpen(false)} type="button">
                        Cancelar
                      </Button>
                      <Button onClick={handleSubmit}>
                        {editingCard ? 'Salvar Alteracoes' : 'Criar Task'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Visualizacao em Lista */}
      {viewMode === 'list' && (
        <ListView
          cards={cardsForView}
          columns={columns}
          projetos={projetos.map(p => ({ id: p.id, nome: p.nome }))}
          usuarios={usuarios}
          onEdit={(card) => {
            const fullCard = cards.find(c => c.id === card.id)
            if (fullCard) handleEdit(fullCard)
          }}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Visualizacao em Tabela */}
      {viewMode === 'table' && (
        <TableView
          cards={cardsForView}
          columns={columns}
          projetos={projetos.map(p => ({ id: p.id, nome: p.nome }))}
          usuarios={usuarios}
          onEdit={(card) => {
            const fullCard = cards.find(c => c.id === card.id)
            if (fullCard) handleEdit(fullCard)
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
            <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
              {columns.map((column) => (
                <Card key={column.id} className="min-h-[500px] w-[280px] shrink-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <div className={cn('w-3 h-3 rounded-full', column.color)} />
                      <span className="truncate">{column.label}</span>
                      <Badge variant="secondary" className="ml-auto shrink-0">
                        {getColumnCards(column.id).length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                            usuarios={usuarios}
                            onEdit={(card) => {
                              setEditingCard(card)
                              setFormData({
                                titulo: card.titulo,
                                descricao: card.descricao || '',
                                prioridade: card.prioridade,
                                projeto_id: card.projeto_id?.toString() || '',
                                cliente_id: card.cliente_id?.toString() || '',
                                trader_id: card.trader_id?.toString() || '',
                                responsavel_relatorio_id: card.responsavel_relatorio_id?.toString() || '',
                                responsavel_revisao_id: card.responsavel_revisao_id?.toString() || '',
                                revisao_relatorio_ok: card.revisao_relatorio_ok,
                                link_relatorio: card.link_relatorio || '',
                                data_vencimento: card.data_vencimento || '',
                              })
                              setIsEditMode(true)
                              setIsDialogOpen(true)
                            }}
                            onView={(card) => {
                              setEditingCard(card)
                              setIsEditMode(false)
                              setIsDialogOpen(true)
                            }}
                            onDelete={handleDelete}
                            onConcluirProjeto={handleConcluirProjeto}
                          />
                        ))}
                      </SortableContext>
                      {getColumnCards(column.id).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Arraste cards aqui
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
              <div className="bg-card border rounded-lg p-3 shadow-lg">
                <h4 className="font-medium text-sm">{activeCard.titulo}</h4>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
