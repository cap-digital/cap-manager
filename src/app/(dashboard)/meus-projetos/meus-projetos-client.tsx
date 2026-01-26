'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Search,
  X,
  Eye,
  ExternalLink,
  Building2,
  User,
  Calendar,
  Briefcase,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  SimplifiedProjeto,
  StatusProjeto
} from '@/components/projetos/types'

interface MeusProjetosClientProps {
  projetos: SimplifiedProjeto[]
}

const statusProjetoOptions: { value: StatusProjeto; label: string; color: string }[] = [
  { value: 'rascunho', label: 'Rascunho', color: 'secondary' },
  { value: 'ativo', label: 'Ativo', color: 'success' },
  { value: 'pausado', label: 'Pausado', color: 'warning' },
  { value: 'finalizado', label: 'Finalizado', color: 'default' },
  { value: 'cancelado', label: 'Cancelado', color: 'destructive' },
]

export function MeusProjetosClient({
  projetos: initialProjetos,
}: MeusProjetosClientProps) {
  const [projetos] = useState(initialProjetos)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const router = useRouter()

  const filteredProjetos = projetos.filter(projeto => {
    const matchesSearch =
      projeto.nome.toLowerCase().includes(search.toLowerCase()) ||
      projeto.cliente?.nome.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || projeto.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Agrupar projetos por cliente
  const projetosPorCliente = filteredProjetos.reduce((acc, projeto) => {
    const clienteNome = projeto.cliente?.nome || 'Sem Cliente'
    if (!acc[clienteNome]) {
      acc[clienteNome] = []
    }
    acc[clienteNome].push(projeto)
    return acc
  }, {} as Record<string, SimplifiedProjeto[]>)

  // Ordenar clientes alfabeticamente
  const clientesOrdenados = Object.keys(projetosPorCliente).sort()

  const getStatusBadge = (status: StatusProjeto) => {
    const config = statusProjetoOptions.find(s => s.value === status)
    return <Badge variant={config?.color as 'default' | 'secondary' | 'destructive'}>{config?.label}</Badge>
  }

  const getDiasAteAcabar = (dataFim: string | null) => {
    if (!dataFim) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim)
    return Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="space-y-4">
        {/* Linha 1: Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos ou clientes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {statusProjetoOptions.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {statusFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 mt-5"
                onClick={() => setStatusFilter('all')}
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}

            <div className="ml-4 text-sm text-muted-foreground mt-5">
              {filteredProjetos.length} projeto(s)
            </div>
          </div>
        </div>
      </div>

      {filteredProjetos.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Nenhum projeto encontrado</h3>
            <p className="text-muted-foreground mt-2">
              {search ? 'Tente buscar com outros termos' : 'Você ainda não está vinculado a nenhum projeto como trader ou colaborador.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {clientesOrdenados.map(clienteNome => {
            const projetosDoCliente = projetosPorCliente[clienteNome]
            return (
              <div key={clienteNome} className="space-y-4">
                {/* Cabeçalho do Cliente */}
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{clienteNome}</h2>
                  <Badge variant="secondary">{projetosDoCliente.length} projeto(s)</Badge>
                </div>

                {/* Projetos do Cliente */}
                <div className="grid grid-cols-1 gap-4 pl-8">
                  {projetosDoCliente.map(projeto => {
                    const dias = getDiasAteAcabar(projeto.data_fim)
                    return (
                      <Card
                        key={projeto.id}
                        className="hover:shadow-md transition-shadow relative group cursor-pointer h-full"
                        onClick={() => router.push(`/projetos/${projeto.id}`)}
                      >
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/projetos/${projeto.id}`) }}>
                            <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
                          </Button>
                        </div>

                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {projeto.nome}
                                {getStatusBadge(projeto.status)}
                              </CardTitle>
                              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                {projeto.agencia && (
                                  <>
                                    <Building2 className="h-3 w-3" />
                                    {projeto.agencia.nome}
                                  </>
                                )}
                              </div>
                            </div>
                            {projeto.pi && (
                              <div className="text-right">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {projeto.pi.identificador}
                                </Badge>
                                <p className="text-xs font-medium mt-1">{formatCurrency(projeto.pi.valor_bruto)}</p>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
                            <div>
                              <p className="text-muted-foreground text-xs uppercase">Trader</p>
                              <div className="font-medium flex items-center gap-1">
                                <User className="h-3 w-3" /> {projeto.trader?.nome || '-'}
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs uppercase">Periodo</p>
                              <div className="font-medium flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {projeto.data_inicio ? formatDate(projeto.data_inicio) : '?'} - {projeto.data_fim ? formatDate(projeto.data_fim) : '?'}
                              </div>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs uppercase">Estrategias</p>
                              <p className="font-medium">{projeto.estrategias_count}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs uppercase">Status Prazo</p>
                              {dias !== null && (
                                <span className={`font-medium ${dias < 7 ? 'text-red-500' : 'text-green-600'}`}>
                                  {dias < 0 ? 'Expirado' : `${dias} dias restantes`}
                                </span>
                              )}
                              {dias === null && <span>-</span>}
                            </div>
                          </div>

                          {/* Quick actions for links */}
                          <div className="flex gap-3 mt-4 pt-4 border-t">
                            {projeto.link_proposta && (
                              <a href={projeto.link_proposta} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                                <ExternalLink className="h-3 w-3" /> Ver Proposta
                              </a>
                            )}
                            {projeto.url_destino && (
                              <a href={projeto.url_destino} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                                <ExternalLink className="h-3 w-3" /> Ver URL Destino
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
