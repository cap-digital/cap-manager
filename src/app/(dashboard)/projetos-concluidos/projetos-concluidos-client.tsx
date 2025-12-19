'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Trash2,
  ExternalLink,
  FileText,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface CardConcluido {
  id: number
  titulo: string
  descricao: string | null
  area: string
  status: string
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  cliente_id: number | null
  projeto_id: number | null
  trader_id: number | null
  link_relatorio: string | null
  faturamento_card_id: number | null
  faturamento_status: string | null
  data_vencimento: string | null
  ordem: number
  created_at: string
  updated_at: string
}

interface ProjetosConcluidosClientProps {
  cards: CardConcluido[]
}

const faturamentoStatusLabels: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  backlog: { label: 'Aguardando', color: 'bg-slate-100 text-slate-700', icon: Clock },
  para_fazer: { label: 'Para Fazer', color: 'bg-blue-100 text-blue-700', icon: Clock },
  em_execucao: { label: 'Em Execução', color: 'bg-yellow-100 text-yellow-700', icon: RefreshCw },
  finalizado: { label: 'Faturado', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
}

const prioridadeColors = {
  baixa: 'bg-slate-100 text-slate-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
}

export function ProjetosConcluidosClient({ cards: initialCards }: ProjetosConcluidosClientProps) {
  const router = useRouter()
  const [cards, setCards] = useState<CardConcluido[]>(initialCards)

  useEffect(() => {
    setCards(initialCards)
  }, [initialCards])

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este card?')) return

    await fetch(`/api/cards-kanban?id=${id}`, { method: 'DELETE' })
    setCards(cards.filter(c => c.id !== id))
  }

  const handleRefresh = () => {
    router.refresh()
  }

  // Separar cards por status de faturamento
  const cardsPendentes = cards.filter(c => c.faturamento_status && c.faturamento_status !== 'finalizado')
  const cardsFaturados = cards.filter(c => c.faturamento_status === 'finalizado')
  const cardsSemFaturamento = cards.filter(c => !c.faturamento_card_id)

  const renderCard = (card: CardConcluido) => {
    const statusInfo = card.faturamento_status
      ? faturamentoStatusLabels[card.faturamento_status] || { label: card.faturamento_status, color: 'bg-gray-100 text-gray-700', icon: AlertCircle }
      : null

    return (
      <TableRow key={card.id}>
        <TableCell>
          <div className="min-w-0">
            <p className="font-medium text-sm">{card.titulo}</p>
            {card.descricao && (
              <p className="text-xs text-muted-foreground truncate max-w-[300px]">
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
          {statusInfo ? (
            <Badge className={cn(statusInfo.color, 'gap-1')} variant="secondary">
              <statusInfo.icon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Sem faturamento</span>
          )}
        </TableCell>
        <TableCell>
          {card.link_relatorio ? (
            <a
              href={card.link_relatorio}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <FileText className="h-4 w-4" />
              Ver Relatório
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          {card.faturamento_card_id ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => router.push('/faturamento')}
            >
              <ExternalLink className="h-4 w-4" />
              Ver no Faturamento
            </Button>
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => handleDelete(card.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Projetos que foram concluídos e estão em processo de faturamento ou já foram faturados
        </p>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar Status
        </Button>
      </div>

      {/* Cards Pendentes de Faturamento */}
      {cardsPendentes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pendentes de Faturamento
              <Badge variant="secondary" className="ml-2">
                {cardsPendentes.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status Faturamento</TableHead>
                    <TableHead>Relatório</TableHead>
                    <TableHead>Ações</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cardsPendentes.map(renderCard)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards Faturados */}
      {cardsFaturados.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Faturados
              <Badge variant="secondary" className="ml-2">
                {cardsFaturados.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status Faturamento</TableHead>
                    <TableHead>Relatório</TableHead>
                    <TableHead>Ações</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cardsFaturados.map(renderCard)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards sem Faturamento (legado ou erro) */}
      {cardsSemFaturamento.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-slate-500" />
              Sem Vínculo de Faturamento
              <Badge variant="secondary" className="ml-2">
                {cardsSemFaturamento.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status Faturamento</TableHead>
                    <TableHead>Relatório</TableHead>
                    <TableHead>Ações</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cardsSemFaturamento.map(renderCard)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {cards.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum projeto concluído ainda. Quando projetos forem finalizados no Gestão de Tráfego,
            eles aparecerão aqui automaticamente.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
