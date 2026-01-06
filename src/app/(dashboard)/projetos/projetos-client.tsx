'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Eye,
  ExternalLink,
  Building2,
  User,
  Calendar,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ProjectDialog } from '@/components/projetos/project-dialog'
import {
  SimplifiedProjeto,
  SimplifiedEstrategia,
  SimplifiedPi,
  SimplifiedAgencia,
  StatusProjeto
} from '@/components/projetos/types'

interface ProjetosClientProps {
  projetos: SimplifiedProjeto[]
  clientes: { id: number; nome: string }[]
  traders: { id: number; nome: string }[]
  pis: SimplifiedPi[]
  agencias: SimplifiedAgencia[]
}

const statusProjetoOptions: { value: StatusProjeto; label: string; color: string }[] = [
  { value: 'rascunho', label: 'Rascunho', color: 'secondary' },
  { value: 'ativo', label: 'Ativo', color: 'success' },
  { value: 'pausado', label: 'Pausado', color: 'warning' },
  { value: 'finalizado', label: 'Finalizado', color: 'default' },
  { value: 'cancelado', label: 'Cancelado', color: 'destructive' },
]

export function ProjetosClient({
  projetos: initialProjetos,
  clientes,
  traders,
  pis,
  agencias,
}: ProjetosClientProps) {
  const [projetos, setProjetos] = useState(initialProjetos)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [traderFilter, setTraderFilter] = useState<string>('all')
  const [agenciaFilter, setAgenciaFilter] = useState<string>('all')
  const [piFilter, setPiFilter] = useState<string>('all')
  const [dataInicioFilter, setDataInicioFilter] = useState<string>('')
  const [dataFimFilter, setDataFimFilter] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const [editingProjeto, setEditingProjeto] = useState<SimplifiedProjeto | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  const filteredProjetos = projetos.filter(projeto => {
    const matchesSearch =
      projeto.nome.toLowerCase().includes(search.toLowerCase()) ||
      projeto.cliente?.nome.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || projeto.status === statusFilter
    const matchesTrader = traderFilter === 'all' || projeto.trader_id === parseInt(traderFilter)
    const matchesAgencia = agenciaFilter === 'all' || projeto.agencia_id === parseInt(agenciaFilter)
    const matchesPi = piFilter === 'all' || projeto.pi_id === parseInt(piFilter)

    const matchesDataInicio = !dataInicioFilter || (projeto.data_inicio && projeto.data_inicio >= dataInicioFilter)
    const matchesDataFim = !dataFimFilter || (projeto.data_fim && projeto.data_fim <= dataFimFilter)

    return matchesSearch && matchesStatus && matchesTrader && matchesAgencia && matchesPi && matchesDataInicio && matchesDataFim
  })

  const openEditDialog = (projeto: SimplifiedProjeto) => {
    setEditingProjeto(projeto)
    setIsOpen(true)
  }

  const handleOptimisticSave = (savedProject: SimplifiedProjeto) => {
    setProjetos(prev => {
      const exists = prev.find(p => p.id === savedProject.id)
      if (exists) {
        return prev.map(p => p.id === savedProject.id ? savedProject : p)
      } else {
        return [savedProject, ...prev]
      }
    })
  }

  const handleDeleteProjeto = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este projeto e todas as estrategias?')) return

    try {
      const response = await fetch(`/api/projetos?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao excluir projeto')
      setProjetos(prev => prev.filter(p => p.id !== id))
      toast({ title: 'Projeto excluido!' })
      router.refresh()
      setIsOpen(false)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro'
      toast({ variant: 'destructive', title: 'Erro', description: errorMessage })
    }
  }

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
      <ProjectDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        project={editingProjeto}
        clientes={clientes}
        traders={traders}
        pis={pis}
        agencias={agencias}
        onSave={handleOptimisticSave}
        onDelete={handleDeleteProjeto}
      />

      {/* Actions Bar */}
      <div className="space-y-4">
        {/* Linha 1: Busca e Botão */}
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

          <Button onClick={() => {
            setEditingProjeto(null)
            setIsOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />Novo Projeto
          </Button>
        </div>

        {/* Linha 2: Filtros organizados */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
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

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Trader</Label>
              <Select value={traderFilter} onValueChange={setTraderFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {traders.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Agência</Label>
              <Select value={agenciaFilter} onValueChange={setAgenciaFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {agencias.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">PI</Label>
              <Select value={piFilter} onValueChange={setPiFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {pis.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.identificador}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="h-9 border-l mx-1" />

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Início a partir de</Label>
              <Input
                type="date"
                value={dataInicioFilter}
                onChange={e => setDataInicioFilter(e.target.value)}
                className="w-[140px] h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fim até</Label>
              <Input
                type="date"
                value={dataFimFilter}
                onChange={e => setDataFimFilter(e.target.value)}
                className="w-[140px] h-9"
              />
            </div>

            {(statusFilter !== 'all' || traderFilter !== 'all' || agenciaFilter !== 'all' || piFilter !== 'all' || dataInicioFilter || dataFimFilter) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={() => {
                  setStatusFilter('all')
                  setTraderFilter('all')
                  setAgenciaFilter('all')
                  setPiFilter('all')
                  setDataInicioFilter('')
                  setDataFimFilter('')
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              {filteredProjetos.length} projeto(s)
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredProjetos.map(projeto => {
          const dias = getDiasAteAcabar(projeto.data_fim)
          return (
            <Card key={projeto.id} className="hover:shadow-md transition-shadow relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(projeto)}>
                  <Pencil className="h-4 w-4 mr-2" /> Editar
                </Button>
              </div>

              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {projeto.nome}
                      {getStatusBadge(projeto.status)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      {projeto.cliente?.nome || 'Sem cliente'}
                      {projeto.agencia && (
                        <>
                          <span className="mx-1">•</span>
                          {projeto.agencia.nome}
                        </>
                      )}
                    </p>
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
                    <p className="font-medium flex items-center gap-1">
                      <User className="h-3 w-3" /> {projeto.trader?.nome || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase">Periodo</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {projeto.data_inicio ? formatDate(projeto.data_inicio) : '?'} - {projeto.data_fim ? formatDate(projeto.data_fim) : '?'}
                    </p>
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
                    <a href={projeto.link_proposta} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Ver Proposta
                    </a>
                  )}
                  {projeto.url_destino && (
                    <a href={projeto.url_destino} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
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
}
