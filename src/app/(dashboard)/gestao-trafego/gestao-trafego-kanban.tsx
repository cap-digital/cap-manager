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

function SortableCard({
  card,
  projetos,
  usuarios,
  onEdit,
  onDelete,
  onMoveToFaturamento,
  onMoveToProjetosFinalizados,
}: {
  card: CardKanban
  projetos: Projeto[]
  usuarios: { id: number; nome: string }[]
  onEdit: (card: CardKanban) => void
  onDelete: (id: number) => void
  onMoveToFaturamento: (card: CardKanban) => void
  onMoveToProjetosFinalizados: (card: CardKanban) => void
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
  const isFee = projeto?.tipo_cobranca === 'fee'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50'
      )}
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
            {projeto.tipo_cobranca === 'fee' && (
              <span className="ml-1 text-purple-600">(FEE)</span>
            )}
          </Badge>
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

      {/* Botões de ação para relatório finalizado */}
      {isRelatorioFinalizado && card.link_relatorio && card.revisao_relatorio_ok && (
        <div className="flex gap-2 mt-3 pt-2 border-t">
          {isFee ? (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                onMoveToProjetosFinalizados(card)
              }}
            >
              Projetos Finalizados
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                onMoveToFaturamento(card)
              }}
            >
              Enviar p/ Faturamento
            </Button>
          )}
        </div>
      )}
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

    if (isColumn && activeCard.status !== overId) {
      // Validações de fluxo
      const projeto = projetos.find(p => p.id === activeCard.projeto_id)

      // Para mover para "em_execucao", precisa ter projeto e trader
      if (overId === 'em_execucao' && (!activeCard.projeto_id || !activeCard.trader_id)) {
        alert('Para mover para Em Execucao, vincule um Projeto e um Trader primeiro.')
        return
      }

      // Para mover para "relatorio_a_fazer", precisa ter responsável de relatório
      if (overId === 'relatorio_a_fazer' && !activeCard.responsavel_relatorio_id) {
        alert('Para mover para Relatorio A Fazer, defina o Responsavel pelo Relatorio primeiro.')
        return
      }

      // Para mover para "relatorio_em_revisao", precisa ter responsável de revisão
      if (overId === 'relatorio_em_revisao' && !activeCard.responsavel_revisao_id) {
        alert('Para mover para Relatorio em Revisao, defina o Responsavel pela Revisao primeiro.')
        return
      }

      // Para mover para "relatorio_finalizado", precisa ter check de revisão e link
      if (overId === 'relatorio_finalizado') {
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
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este card?')) return

    await fetch(`/api/cards-kanban?id=${id}`, { method: 'DELETE' })
    setCards(cards.filter(c => c.id !== id))
  }

  const handleMoveToFaturamento = async (card: CardKanban) => {
    // Criar card no faturamento
    await fetch('/api/cards-kanban', {
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
      }),
    })

    // Remover do gestão de tráfego
    await fetch(`/api/cards-kanban?id=${card.id}`, { method: 'DELETE' })
    setCards(cards.filter(c => c.id !== card.id))

    alert('Card enviado para Faturamento!')
    router.refresh()
  }

  const handleMoveToProjetosFinalizados = async (card: CardKanban) => {
    // Criar card nos projetos finalizados
    await fetch('/api/cards-kanban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: card.titulo,
        descricao: card.descricao,
        area: 'projetos_finalizados',
        status: 'backlog',
        prioridade: card.prioridade,
        projeto_id: card.projeto_id,
        cliente_id: card.cliente_id,
        trader_id: card.trader_id,
      }),
    })

    // Remover do gestão de tráfego
    await fetch(`/api/cards-kanban?id=${card.id}`, { method: 'DELETE' })
    setCards(cards.filter(c => c.id !== card.id))

    alert('Card enviado para Projetos Finalizados!')
    router.refresh()
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
    setIsDialogOpen(false)
  }

  const getColumnCards = (columnId: string) => {
    return cards.filter(c => c.status === columnId).sort((a, b) => a.ordem - b.ordem)
  }

  // Campos visíveis baseado no status atual
  const showRelatorioFields = editingCard && ['relatorio_a_fazer', 'relatorio_em_revisao', 'relatorio_finalizado'].includes(editingCard.status)
  const showRevisaoFields = editingCard && ['relatorio_em_revisao', 'relatorio_finalizado'].includes(editingCard.status)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Fluxo: Backlog → Para Fazer → Em Execucao → Projeto Finalizado → Relatorio A Fazer → Relatorio em Revisao → Relatorio Finalizado
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCard ? 'Editar Task' : 'Nova Task'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                    onCheckedChange={(checked) => setFormData({ ...formData, revisao_relatorio_ok: checked as boolean })}
                  />
                  <Label htmlFor="revisao_ok" className="cursor-pointer">
                    Revisao do relatorio aprovada
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingCard ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto">
          {columns.map((column) => (
            <Card key={column.id} className="min-h-[500px] min-w-[250px]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <div className={cn('w-3 h-3 rounded-full', column.color)} />
                  <span className="truncate">{column.label}</span>
                  <Badge variant="secondary" className="ml-auto shrink-0">
                    {getColumnCards(column.id).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SortableContext
                  items={getColumnCards(column.id).map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                  id={column.id}
                >
                  {getColumnCards(column.id).map((card) => (
                    <SortableCard
                      key={card.id}
                      card={card}
                      projetos={projetos}
                      usuarios={usuarios}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onMoveToFaturamento={handleMoveToFaturamento}
                      onMoveToProjetosFinalizados={handleMoveToProjetosFinalizados}
                    />
                  ))}
                </SortableContext>
                {getColumnCards(column.id).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Arraste cards aqui
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="bg-card border rounded-lg p-3 shadow-lg">
              <h4 className="font-medium text-sm">{activeCard.titulo}</h4>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
