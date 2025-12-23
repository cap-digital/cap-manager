'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  Loader2,
  User,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  CalendarDays,
  Building2,
  TrendingUp,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Usuario } from '@/types'

type GrupoRevisao = 'A' | 'B' | 'C'

interface Estrategia {
  id: number
  plataforma: string
  estrategia: string | null
  status: string
  gasto_ate_momento: number | null
  entregue_ate_momento: number | null
  data_atualizacao: string | null
}

interface ProjetoRevisao {
  id: number
  nome: string
  cliente_id: number
  cliente: { id: number; nome: string } | null
  trader_id: number | null
  trader: { id: number; nome: string } | null
  colaborador_id: number | null
  colaborador: { id: number; nome: string } | null
  status: string
  grupo_revisao: GrupoRevisao
  data_inicio: string | null
  data_fim: string | null
  revisado_hoje: boolean
  data_revisao: string | null
  revisado_por: { id: number; nome: string } | null
  estrategias: Estrategia[]
}

interface FollowUpClientProps {
  projetos: ProjetoRevisao[]
  gruposHoje: GrupoRevisao[]
  traders: { id: number; nome: string }[]
  currentUser: Usuario | null
}

const grupoConfig: Record<GrupoRevisao, { label: string; description: string; color: string }> = {
  'A': { label: 'Grupo A', description: 'Todos os dias', color: 'bg-green-100 text-green-700 border-green-300' },
  'B': { label: 'Grupo B', description: 'Seg, Qua, Sex', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  'C': { label: 'Grupo C', description: 'Ter, Qui', color: 'bg-purple-100 text-purple-700 border-purple-300' },
}

export function FollowUpClient({
  projetos: initialProjetos,
  gruposHoje,
  traders,
  currentUser,
}: FollowUpClientProps) {
  const [projetos, setProjetos] = useState(initialProjetos)
  const [search, setSearch] = useState('')
  const [traderFilter, setTraderFilter] = useState<string>('all')
  const [grupoFilter, setGrupoFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loadingProjetoId, setLoadingProjetoId] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Filtrar projetos
  const filteredProjetos = useMemo(() => {
    return projetos.filter(projeto => {
      const matchesSearch =
        projeto.nome.toLowerCase().includes(search.toLowerCase()) ||
        projeto.cliente?.nome.toLowerCase().includes(search.toLowerCase())

      const matchesTrader =
        traderFilter === 'all' || projeto.trader_id === Number(traderFilter)

      const matchesGrupo =
        grupoFilter === 'all' || projeto.grupo_revisao === grupoFilter

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pendente' && !projeto.revisado_hoje) ||
        (statusFilter === 'revisado' && projeto.revisado_hoje)

      return matchesSearch && matchesTrader && matchesGrupo && matchesStatus
    })
  }, [projetos, search, traderFilter, grupoFilter, statusFilter])

  // Agrupar projetos por grupo de revisão
  const projetosAgrupados = useMemo(() => {
    const grupos: Record<GrupoRevisao, ProjetoRevisao[]> = {
      'A': [],
      'B': [],
      'C': [],
    }

    filteredProjetos.forEach(projeto => {
      grupos[projeto.grupo_revisao].push(projeto)
    })

    return grupos
  }, [filteredProjetos])

  // Estatísticas
  const stats = useMemo(() => {
    const total = projetos.length
    const revisados = projetos.filter(p => p.revisado_hoje).length
    const pendentes = total - revisados

    return { total, revisados, pendentes }
  }, [projetos])

  // Marcar como revisado
  const handleMarcarRevisado = async (projetoId: number) => {
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Usuário não identificado',
      })
      return
    }

    setLoadingProjetoId(projetoId)

    try {
      const response = await fetch('/api/revisoes-diarias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projeto_id: projetoId,
        }),
      })

      if (!response.ok) throw new Error('Erro ao marcar revisão')

      // Atualizar estado local
      setProjetos(prev =>
        prev.map(p =>
          p.id === projetoId
            ? {
                ...p,
                revisado_hoje: true,
                data_revisao: new Date().toISOString(),
                revisado_por: { id: currentUser.id, nome: currentUser.nome },
              }
            : p
        )
      )

      toast({ title: 'Projeto marcado como revisado!' })
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível marcar a revisão',
      })
    } finally {
      setLoadingProjetoId(null)
    }
  }

  // Verificar se há dados de acompanhamento desatualizados
  const temDadosDesatualizados = (projeto: ProjetoRevisao) => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    return projeto.estrategias.some(e => {
      if (!e.data_atualizacao) return true
      const dataAtualizacao = new Date(e.data_atualizacao)
      dataAtualizacao.setHours(0, 0, 0, 0)
      // Considera desatualizado se passou mais de 1 dia
      const diffDias = Math.floor((hoje.getTime() - dataAtualizacao.getTime()) / (1000 * 60 * 60 * 24))
      return diffDias > 1
    })
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total para Revisar</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Revisados</p>
                <p className="text-3xl font-bold text-green-700">{stats.revisados}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.pendentes > 0 ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700">Pendentes</p>
                <p className="text-3xl font-bold text-amber-700">{stats.pendentes}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grupos do dia */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">Grupos de hoje:</span>
        {gruposHoje.map(grupo => (
          <Badge key={grupo} className={grupoConfig[grupo].color}>
            {grupoConfig[grupo].label} - {grupoConfig[grupo].description}
          </Badge>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={traderFilter} onValueChange={setTraderFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por trader" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os traders</SelectItem>
            {traders.map(trader => (
              <SelectItem key={trader.id} value={String(trader.id)}>
                {trader.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={grupoFilter} onValueChange={setGrupoFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Grupo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos grupos</SelectItem>
            {gruposHoje.map(grupo => (
              <SelectItem key={grupo} value={grupo}>
                {grupoConfig[grupo].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="revisado">Revisados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="grupos">Por Grupo</TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          {filteredProjetos.length > 0 ? (
            <div className="space-y-4">
              {filteredProjetos.map(projeto => (
                <Card
                  key={projeto.id}
                  className={`transition-all ${
                    projeto.revisado_hoje
                      ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10'
                      : temDadosDesatualizados(projeto)
                      ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/10'
                      : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{projeto.nome}</CardTitle>
                          <Badge className={grupoConfig[projeto.grupo_revisao].color}>
                            {grupoConfig[projeto.grupo_revisao].label}
                          </Badge>
                          {projeto.revisado_hoje && (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Revisado
                            </Badge>
                          )}
                          {!projeto.revisado_hoje && temDadosDesatualizados(projeto) && (
                            <Badge variant="destructive" className="bg-amber-100 text-amber-700 border-amber-300">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Dados desatualizados
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-4 flex-wrap">
                          {projeto.cliente && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {projeto.cliente.nome}
                            </span>
                          )}
                          {projeto.trader && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {projeto.trader.nome}
                            </span>
                          )}
                          {projeto.data_fim && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              Até {formatDate(projeto.data_fim)}
                            </span>
                          )}
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/projetos/${projeto.id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Fazer Follow-up
                          </Link>
                        </Button>

                        {!projeto.revisado_hoje && (
                          <Button
                            size="sm"
                            onClick={() => handleMarcarRevisado(projeto.id)}
                            disabled={loadingProjetoId === projeto.id}
                          >
                            {loadingProjetoId === projeto.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                            )}
                            Marcar Revisado
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {projeto.estrategias.length > 0 && (
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {projeto.estrategias.map(estrategia => (
                          <div
                            key={estrategia.id}
                            className="p-3 bg-muted/50 rounded-lg text-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium capitalize flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {estrategia.plataforma}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {estrategia.estrategia || estrategia.status}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-muted-foreground">
                              <p>
                                Gasto: {estrategia.gasto_ate_momento !== null ? formatCurrency(estrategia.gasto_ate_momento) : '-'}
                              </p>
                              <p>
                                Entregue: {estrategia.entregue_ate_momento?.toLocaleString('pt-BR') || '-'}
                              </p>
                              {estrategia.data_atualizacao && (
                                <p className="text-xs">
                                  Atualizado: {formatDate(estrategia.data_atualizacao)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {projeto.revisado_hoje && projeto.revisado_por && (
                        <p className="text-xs text-muted-foreground mt-3">
                          Revisado por {projeto.revisado_por.nome} em {projeto.data_revisao ? formatDate(projeto.data_revisao) : 'hoje'}
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">
                  {projetos.length === 0
                    ? 'Nenhum projeto para revisar hoje'
                    : 'Nenhum projeto encontrado com os filtros aplicados'}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {projetos.length === 0
                    ? 'Todos os projetos ativos precisam ter um grupo de revisão definido'
                    : 'Tente ajustar os filtros de busca'}
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="grupos">
          <div className="space-y-6">
            {gruposHoje.map(grupo => {
              const projetosDoGrupo = projetosAgrupados[grupo]
              const revisados = projetosDoGrupo.filter(p => p.revisado_hoje).length
              const total = projetosDoGrupo.length

              return (
                <Card key={grupo}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={grupoConfig[grupo].color + ' text-base px-3 py-1'}>
                          {grupoConfig[grupo].label}
                        </Badge>
                        <CardDescription>{grupoConfig[grupo].description}</CardDescription>
                      </div>
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">{revisados}</span>
                        <span className="text-muted-foreground"> / {total} revisados</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {projetosDoGrupo.length > 0 ? (
                      <div className="space-y-3">
                        {projetosDoGrupo.map(projeto => (
                          <div
                            key={projeto.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              projeto.revisado_hoje
                                ? 'bg-green-50 border-green-200 dark:bg-green-950/20'
                                : 'bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {projeto.revisado_hoje ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <Clock className="h-5 w-5 text-amber-500" />
                              )}
                              <div>
                                <p className="font-medium">{projeto.nome}</p>
                                <p className="text-sm text-muted-foreground">
                                  {projeto.cliente?.nome}
                                  {projeto.trader && ` • ${projeto.trader.nome}`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/projetos/${projeto.id}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                              {!projeto.revisado_hoje && (
                                <Button
                                  size="sm"
                                  onClick={() => handleMarcarRevisado(projeto.id)}
                                  disabled={loadingProjetoId === projeto.id}
                                >
                                  {loadingProjetoId === projeto.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Revisar'
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhum projeto neste grupo para hoje
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
