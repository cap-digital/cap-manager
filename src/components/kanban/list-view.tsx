'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Edit, Folder, Trash2, User, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface CardKanban {
  id: number
  titulo: string
  descricao?: string | null
  status: string
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  projeto_id?: number | null
  cliente_id?: number | null
  trader_id?: number | null
  data_vencimento?: string | null
}

interface Column {
  id: string
  label: string
  color: string
}

interface ListViewProps {
  cards: CardKanban[]
  columns: Column[]
  projetos: { id: number; nome: string }[]
  clientes?: { id: number; nome: string }[]
  usuarios: { id: number; nome: string }[]
  onEdit: (card: CardKanban) => void
  onDelete: (id: number) => void
  onStatusChange: (cardId: number, newStatus: string) => void
}

const prioridadeColors = {
  baixa: 'bg-slate-100 text-slate-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
}

export function ListView({
  cards,
  columns,
  projetos,
  clientes,
  usuarios,
  onEdit,
  onDelete,
  onStatusChange,
}: ListViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(columns.map(c => c.id))
  )

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const getColumnCards = (columnId: string) => {
    return cards.filter(c => c.status === columnId)
  }

  return (
    <div className="space-y-4">
      {columns.map((column) => {
        const columnCards = getColumnCards(column.id)
        const isExpanded = expandedGroups.has(column.id)

        return (
          <Card key={column.id}>
            <CardHeader
              className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleGroup(column.id)}
            >
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <div className={cn('w-3 h-3 rounded-full', column.color)} />
                {column.label}
                <Badge variant="secondary" className="ml-auto">
                  {columnCards.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            {isExpanded && (
              <CardContent className="pt-0">
                {columnCards.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum card nesta coluna
                  </p>
                ) : (
                  <div className="divide-y">
                    {columnCards.map((card) => {
                      const projeto = projetos.find(p => p.id === card.projeto_id)
                      const cliente = clientes?.find(c => c.id === card.cliente_id)
                      const responsavel = usuarios.find(u => u.id === card.trader_id)

                      return (
                        <div
                          key={card.id}
                          className="flex items-center gap-4 py-3 hover:bg-muted/30 px-2 -mx-2 rounded-lg transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{card.titulo}</h4>
                            {card.descricao && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {card.descricao}
                              </p>
                            )}
                          </div>

                          <Badge className={prioridadeColors[card.prioridade]} variant="secondary">
                            {card.prioridade}
                          </Badge>

                          {cliente && (
                            <span className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="truncate max-w-[100px]">{cliente.nome}</span>
                            </span>
                          )}

                          {projeto && (
                            <Link
                              href={`/projetos/${projeto.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hidden md:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Folder className="h-3 w-3" />
                              <span className="truncate max-w-[100px] hover:underline">{projeto.nome}</span>
                            </Link>
                          )}

                          {responsavel && (
                            <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="truncate max-w-[80px]">{responsavel.nome}</span>
                            </div>
                          )}

                          {card.data_vencimento && (
                            <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(card.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </div>
                          )}

                          <Select
                            value={card.status}
                            onValueChange={(v) => onStatusChange(card.id, v)}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map((col) => (
                                <SelectItem key={col.id} value={col.id}>
                                  <div className="flex items-center gap-2">
                                    <div className={cn('w-2 h-2 rounded-full', col.color)} />
                                    {col.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onEdit(card)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => onDelete(card.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
