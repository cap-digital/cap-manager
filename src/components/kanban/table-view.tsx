'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface CardKanban {
  id: number
  titulo: string
  descricao: string | null
  status: string
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  projeto_id: number | null
  cliente_id: number | null
  trader_id: number | null
  data_vencimento: string | null
}

interface Column {
  id: string
  label: string
  color: string
}

interface TableViewProps {
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

export function TableView({
  cards,
  columns,
  projetos,
  clientes,
  usuarios,
  onEdit,
  onDelete,
  onStatusChange,
}: TableViewProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Titulo</TableHead>
              <TableHead className="min-w-[100px]">Prioridade</TableHead>
              <TableHead className="min-w-[150px]">Status</TableHead>
              <TableHead className="min-w-[150px]">Projeto</TableHead>
              {clientes && <TableHead className="min-w-[120px]">Cliente</TableHead>}
              <TableHead className="min-w-[120px]">Responsavel</TableHead>
              <TableHead className="min-w-[100px]">Vencimento</TableHead>
              <TableHead className="w-[100px]">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={clientes ? 8 : 7} className="text-center py-8 text-muted-foreground">
                  Nenhum card encontrado
                </TableCell>
              </TableRow>
            ) : (
              cards.map((card) => {
                const projeto = projetos.find(p => p.id === card.projeto_id)
                const cliente = clientes?.find(c => c.id === card.cliente_id)
                const responsavel = usuarios.find(u => u.id === card.trader_id)
                const column = columns.find(c => c.id === card.status)

                return (
                  <TableRow key={card.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{card.titulo}</p>
                        {card.descricao && (
                          <p className="text-xs text-muted-foreground truncate">
                            {card.descricao}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={prioridadeColors[card.prioridade]} variant="secondary">
                        {card.prioridade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={card.status}
                        onValueChange={(v) => onStatusChange(card.id, v)}
                      >
                        <SelectTrigger className="w-full h-8 text-xs">
                          <div className="flex items-center gap-2">
                            {column && (
                              <div className={cn('w-2 h-2 rounded-full shrink-0', column.color)} />
                            )}
                            <SelectValue />
                          </div>
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
                    </TableCell>
                    <TableCell>
                      {projeto ? (
                        <Link
                          href={`/projetos/${projeto.id}`}
                          className="text-sm truncate block max-w-[150px] hover:underline hover:text-primary transition-colors"
                        >
                          {projeto.nome}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {clientes && (
                      <TableCell>
                        {cliente ? (
                          <span className="text-sm truncate block max-w-[120px]">{cliente.nome}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {responsavel ? (
                        <span className="text-sm truncate block max-w-[120px]">{responsavel.nome}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {card.data_vencimento ? (
                        <span className="text-sm">
                          {new Date(card.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
