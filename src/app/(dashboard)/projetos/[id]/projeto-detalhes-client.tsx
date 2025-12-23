'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  DollarSign,
  Loader2,
  Layers,
  ExternalLink,
  TrendingUp,
  Target,
  Settings,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { SearchableSelect } from '@/components/ui/searchable-select'

type TipoCobranca = 'td' | 'fee'
type StatusProjeto = 'rascunho' | 'ativo' | 'pausado' | 'finalizado' | 'cancelado'
type StatusEstrategia = 'planejada' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada'
type Plataforma = 'meta' | 'google' | 'tiktok' | 'linkedin' | 'twitter' | 'pinterest' | 'spotify' | 'programatica' | 'outro'
type GrupoRevisao = 'A' | 'B' | 'C'

interface SimplifiedPi {
  id: number
  identificador: string
  valor_bruto: number
}

interface SimplifiedAgencia {
  id: number
  nome: string
}

interface SimplifiedEstrategia {
  id: number
  projeto_id: number
  plataforma: Plataforma
  nome_conta: string | null
  id_conta: string | null
  campaign_id: string | null
  estrategia: string | null
  kpi: string | null
  status: StatusEstrategia
  valor_bruto: number
  porcentagem_agencia: number
  porcentagem_plataforma: number
  entrega_contratada: number | null
  estimativa_resultado: number | null
  estimativa_sucesso: number | null
  gasto_ate_momento: number | null
  entregue_ate_momento: number | null
  data_atualizacao: string | null
  created_at: string
  updated_at: string
}

interface SimplifiedProjeto {
  id: number
  cliente_id: number
  nome: string
  pi_id: number | null
  pi: SimplifiedPi | null
  tipo_cobranca: TipoCobranca
  agencia_id: number | null
  agencia: SimplifiedAgencia | null
  trader_id: number | null
  colaborador_id: number | null
  status: StatusProjeto
  data_inicio: string | null
  data_fim: string | null
  link_proposta: string | null
  url_destino: string | null
  grupo_revisao: GrupoRevisao | null
  estrategias: SimplifiedEstrategia[]
  created_at: string
  updated_at: string
  cliente: { id: number; nome: string } | null
  trader: { id: number; nome: string } | null
  colaborador: { id: number; nome: string } | null
}

interface ProjetoDetalhesClientProps {
  projeto: SimplifiedProjeto
  traders: { id: number; nome: string }[]
  pis: SimplifiedPi[]
  agencias: SimplifiedAgencia[]
  clientes: { id: number; nome: string }[]
}

const statusProjetoOptions: { value: StatusProjeto; label: string; color: string }[] = [
  { value: 'rascunho', label: 'Rascunho', color: 'secondary' },
  { value: 'ativo', label: 'Ativo', color: 'success' },
  { value: 'pausado', label: 'Pausado', color: 'warning' },
  { value: 'finalizado', label: 'Finalizado', color: 'default' },
  { value: 'cancelado', label: 'Cancelado', color: 'destructive' },
]

const statusEstrategiaOptions: { value: StatusEstrategia; label: string; color: string }[] = [
  { value: 'planejada', label: 'Planejada', color: 'secondary' },
  { value: 'ativa', label: 'Ativa', color: 'success' },
  { value: 'pausada', label: 'Pausada', color: 'warning' },
  { value: 'finalizada', label: 'Finalizada', color: 'default' },
  { value: 'cancelada', label: 'Cancelada', color: 'destructive' },
]

const plataformaOptions: { value: Plataforma; label: string }[] = [
  { value: 'meta', label: 'Meta (Facebook/Instagram)' },
  { value: 'google', label: 'Google Ads' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'programatica', label: 'Programatica' },
  { value: 'outro', label: 'Outro' },
]

const estrategiaOptions = [
  'Tráfego',
  'Conversão',
  'Mensagens Iniciadas',
  'Compras',
  'Adição ao Carrinho',
  'Alcance',
  'Visualizações',
]

const grupoRevisaoOptions: { value: GrupoRevisao; label: string; description: string }[] = [
  { value: 'A', label: 'Grupo A', description: 'Todos os dias' },
  { value: 'B', label: 'Grupo B', description: 'Segunda, Quarta e Sexta' },
  { value: 'C', label: 'Grupo C', description: 'Terça e Quinta' },
]

const tipoCobrancaOptions: { value: TipoCobranca; label: string }[] = [
  { value: 'td', label: 'TD (Trading Desk)' },
  { value: 'fee', label: 'FEE' },
]

const kpiOptions = [
  'CPA',
  'CPC',
  'CPM',
  'CPL',
  'CPV',
]

export function ProjetoDetalhesClient({
  projeto: initialProjeto,
  traders,
  pis,
  agencias,
  clientes,
}: ProjetoDetalhesClientProps) {
  const [projeto, setProjeto] = useState(initialProjeto)
  const [isLoading, setIsLoading] = useState(false)
  const [isEstrategiaOpen, setIsEstrategiaOpen] = useState(false)
  const [isProjetoOpen, setIsProjetoOpen] = useState(false)
  const [editingEstrategia, setEditingEstrategia] = useState<SimplifiedEstrategia | null>(null)

  const [projetoForm, setProjetoForm] = useState({
    cliente_id: projeto.cliente_id,
    nome: projeto.nome,
    pi_id: projeto.pi_id,
    tipo_cobranca: projeto.tipo_cobranca,
    agencia_id: projeto.agencia_id,
    trader_id: projeto.trader_id,
    colaborador_id: projeto.colaborador_id,
    status: projeto.status,
    data_inicio: projeto.data_inicio || '',
    data_fim: projeto.data_fim || '',
    link_proposta: projeto.link_proposta || '',
    url_destino: projeto.url_destino || '',
    grupo_revisao: projeto.grupo_revisao,
  })

  const [estrategiaForm, setEstrategiaForm] = useState({
    plataforma: '' as Plataforma | '',
    nome_conta: '',
    id_conta: '',
    campaign_id: '',
    estrategia: '',
    kpi: '',
    status: 'planejada' as StatusEstrategia,
    valor_bruto: '',
    porcentagem_agencia: '',
    porcentagem_plataforma: '',
    entrega_contratada: '',
    gasto_ate_momento: '',
    entregue_ate_momento: '',
    data_atualizacao: '',
  })

  const router = useRouter()
  const { toast } = useToast()

  const resetProjetoForm = () => {
    setProjetoForm({
      cliente_id: projeto.cliente_id,
      nome: projeto.nome,
      pi_id: projeto.pi_id,
      tipo_cobranca: projeto.tipo_cobranca,
      agencia_id: projeto.agencia_id,
      trader_id: projeto.trader_id,
      colaborador_id: projeto.colaborador_id,
      status: projeto.status,
      data_inicio: projeto.data_inicio || '',
      data_fim: projeto.data_fim || '',
      link_proposta: projeto.link_proposta || '',
      url_destino: projeto.url_destino || '',
      grupo_revisao: projeto.grupo_revisao,
    })
  }

  const resetEstrategiaForm = () => {
    setEstrategiaForm({
      plataforma: '',
      nome_conta: '',
      id_conta: '',
      campaign_id: '',
      estrategia: '',
      kpi: '',
      status: 'planejada',
      valor_bruto: '',
      porcentagem_agencia: '',
      porcentagem_plataforma: '',
      entrega_contratada: '',
      gasto_ate_momento: '',
      entregue_ate_momento: '',
      data_atualizacao: '',
    })
    setEditingEstrategia(null)
  }

  const getStatusBadge = (status: StatusProjeto) => {
    const config = statusProjetoOptions.find(s => s.value === status)
    return <Badge variant={config?.color as 'default' | 'secondary' | 'destructive'}>{config?.label}</Badge>
  }

  const getEstrategiaStatusBadge = (status: StatusEstrategia) => {
    const config = statusEstrategiaOptions.find(s => s.value === status)
    return <Badge variant={config?.color as 'default' | 'secondary' | 'destructive'}>{config?.label}</Badge>
  }

  const getDiasAteAcabar = (dataFim: string | null) => {
    if (!dataFim) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const fim = new Date(dataFim)
    return Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getDiasVeiculacao = () => {
    if (!projeto.data_inicio || !projeto.data_fim) return null
    const inicio = new Date(projeto.data_inicio)
    const fim = new Date(projeto.data_fim)
    return Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
  }

  const calcularValoresEstrategia = (e: SimplifiedEstrategia) => {
    const valorLiquido = e.valor_bruto - (e.valor_bruto * e.porcentagem_agencia / 100)
    const valorPlataforma = valorLiquido * (e.porcentagem_plataforma / 100)
    const diasVeiculacao = getDiasVeiculacao()
    const valorPorDia = diasVeiculacao && diasVeiculacao > 0 ? valorPlataforma / diasVeiculacao : null
    const percentualEntrega = e.entrega_contratada && e.entregue_ate_momento
      ? (e.entregue_ate_momento / e.entrega_contratada) * 100
      : null
    const valorRestante = e.gasto_ate_momento !== null ? valorPlataforma - e.gasto_ate_momento : valorPlataforma
    const custoResultado = e.entregue_ate_momento && e.gasto_ate_momento
      ? e.gasto_ate_momento / e.entregue_ate_momento
      : null

    return { valorLiquido, valorPlataforma, valorPorDia, percentualEntrega, valorRestante, custoResultado }
  }

  const handleSubmitProjeto = async (e: React.FormEvent, closeAfterSave = true) => {
    e.preventDefault()
    setIsLoading(true)

    const isFee = projetoForm.tipo_cobranca === 'fee'
    const payload = {
      cliente_id: projetoForm.cliente_id,
      nome: projetoForm.nome,
      pi_id: isFee ? null : projetoForm.pi_id,
      tipo_cobranca: projetoForm.tipo_cobranca,
      agencia_id: isFee ? null : projetoForm.agencia_id,
      trader_id: projetoForm.trader_id,
      colaborador_id: projetoForm.colaborador_id,
      status: projetoForm.status,
      data_inicio: projetoForm.data_inicio || null,
      data_fim: projetoForm.data_fim || null,
      link_proposta: projetoForm.link_proposta || null,
      url_destino: projetoForm.url_destino || null,
      grupo_revisao: projetoForm.grupo_revisao,
    }

    try {
      const response = await fetch(`/api/projetos?id=${projeto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Erro ao atualizar projeto')

      const updatedProjeto = await response.json()

      // Atualizar estado local
      setProjeto(prev => ({
        ...prev,
        ...payload,
        cliente: clientes.find(c => c.id === payload.cliente_id) || null,
        trader: traders.find(t => t.id === payload.trader_id) || null,
        colaborador: traders.find(t => t.id === payload.colaborador_id) || null,
        pi: pis.find(p => p.id === payload.pi_id) || null,
        agencia: agencias.find(a => a.id === payload.agencia_id) || null,
      }))

      toast({ title: 'Projeto atualizado!' })
      if (closeAfterSave) {
        setIsProjetoOpen(false)
      }
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro'
      toast({ variant: 'destructive', title: 'Erro', description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitEstrategia = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const payload = {
      projeto_id: projeto.id,
      plataforma: estrategiaForm.plataforma,
      nome_conta: estrategiaForm.nome_conta || null,
      id_conta: estrategiaForm.id_conta || null,
      campaign_id: estrategiaForm.campaign_id || null,
      estrategia: estrategiaForm.estrategia || null,
      kpi: estrategiaForm.kpi || null,
      status: estrategiaForm.status,
      valor_bruto: estrategiaForm.valor_bruto ? parseFloat(estrategiaForm.valor_bruto) : 0,
      porcentagem_agencia: estrategiaForm.porcentagem_agencia ? parseFloat(estrategiaForm.porcentagem_agencia) : 0,
      porcentagem_plataforma: estrategiaForm.porcentagem_plataforma ? parseFloat(estrategiaForm.porcentagem_plataforma) : 0,
      entrega_contratada: estrategiaForm.entrega_contratada ? parseFloat(estrategiaForm.entrega_contratada) : null,
      gasto_ate_momento: estrategiaForm.gasto_ate_momento ? parseFloat(estrategiaForm.gasto_ate_momento) : null,
      entregue_ate_momento: estrategiaForm.entregue_ate_momento ? parseFloat(estrategiaForm.entregue_ate_momento) : null,
      data_atualizacao: estrategiaForm.data_atualizacao || null,
    }

    try {
      if (editingEstrategia) {
        const response = await fetch(`/api/estrategias?id=${editingEstrategia.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error('Erro ao atualizar estrategia')
        const updatedEstrategia = await response.json()

        setProjeto(prev => ({
          ...prev,
          estrategias: prev.estrategias.map(est =>
            est.id === editingEstrategia.id ? { ...est, ...updatedEstrategia } : est
          )
        }))

        toast({ title: 'Estrategia atualizada!' })
      } else {
        const response = await fetch('/api/estrategias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error('Erro ao criar estrategia')
        const novaEstrategia = await response.json()

        setProjeto(prev => ({
          ...prev,
          estrategias: [...prev.estrategias, novaEstrategia]
        }))

        toast({ title: 'Estrategia adicionada!' })
      }

      setIsEstrategiaOpen(false)
      resetEstrategiaForm()
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro'
      toast({ variant: 'destructive', title: 'Erro', description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEstrategia = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta estrategia?')) return

    try {
      const response = await fetch(`/api/estrategias?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao excluir estrategia')

      setProjeto(prev => ({
        ...prev,
        estrategias: prev.estrategias.filter(e => e.id !== parseInt(id))
      }))

      toast({ title: 'Estrategia excluida!' })
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro'
      toast({ variant: 'destructive', title: 'Erro', description: errorMessage })
    }
  }

  const diasAteAcabar = getDiasAteAcabar(projeto.data_fim)
  const diasVeiculacao = getDiasVeiculacao()
  const totalValorBruto = projeto.estrategias.reduce((acc, e) => acc + e.valor_bruto, 0)
  const totalGasto = projeto.estrategias.reduce((acc, e) => acc + (e.gasto_ate_momento || 0), 0)
  const totalLiquido = projeto.estrategias.reduce((acc, e) => {
    const calc = calcularValoresEstrategia(e)
    return acc + calc.valorPlataforma
  }, 0)
  const totalRestante = totalLiquido - totalGasto

  const isFee = projetoForm.tipo_cobranca === 'fee'

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-3">
          {getStatusBadge(projeto.status)}
          {diasAteAcabar !== null && diasAteAcabar <= 7 && diasAteAcabar >= 0 && (
            <Badge variant="destructive">{diasAteAcabar}d restantes</Badge>
          )}
          {diasAteAcabar !== null && diasAteAcabar < 0 && (
            <Badge variant="secondary">Encerrado</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { resetProjetoForm(); setIsProjetoOpen(true) }}>
            <Settings className="h-4 w-4 mr-2" />Editar Projeto
          </Button>
          <Button onClick={() => { resetEstrategiaForm(); setIsEstrategiaOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />Nova Estratégia
          </Button>
        </div>
      </div>

      {/* Informações do Projeto - Cards de Destaque */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card Principal - Tipo e Cliente */}
        <Card className="col-span-2 md:col-span-1 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-white">{projeto.tipo_cobranca?.toUpperCase() || 'TD'}</Badge>
              {projeto.grupo_revisao && (
                <Badge variant="secondary" className="text-xs">Grupo {projeto.grupo_revisao}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="font-semibold truncate">{projeto.cliente?.nome || '-'}</p>
          </CardContent>
        </Card>

        {/* Card Responsáveis */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Trader</p>
            <p className="font-medium text-sm truncate">{projeto.trader?.nome || '-'}</p>
            <p className="text-xs text-muted-foreground mt-2 mb-1">Colaborador</p>
            <p className="font-medium text-sm truncate">{projeto.colaborador?.nome || '-'}</p>
          </CardContent>
        </Card>

        {/* Card Datas */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Período</p>
                <p className="font-medium text-sm">
                  {projeto.data_inicio ? formatDate(projeto.data_inicio) : '-'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">até</p>
                <p className="font-medium text-sm">
                  {projeto.data_fim ? formatDate(projeto.data_fim) : '-'}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs text-muted-foreground">Duração</p>
                <p className="font-bold text-lg">{diasVeiculacao || '-'}</p>
                <p className="text-xs text-muted-foreground">dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Dias Restantes */}
        <Card className={diasAteAcabar !== null && diasAteAcabar <= 7 && diasAteAcabar >= 0 ? 'bg-red-50 border-red-200' : diasAteAcabar !== null && diasAteAcabar < 0 ? 'bg-gray-50' : ''}>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Dias Restantes</p>
            {diasAteAcabar !== null ? (
              <>
                <p className={`text-3xl font-bold ${diasAteAcabar <= 7 && diasAteAcabar >= 0 ? 'text-red-600' : diasAteAcabar < 0 ? 'text-gray-400' : 'text-primary'}`}>
                  {diasAteAcabar < 0 ? '0' : diasAteAcabar}
                </p>
                {diasAteAcabar < 0 && <p className="text-xs text-gray-500">Encerrado</p>}
                {diasAteAcabar <= 7 && diasAteAcabar >= 0 && <p className="text-xs text-red-600 font-medium">Atenção!</p>}
              </>
            ) : (
              <p className="text-2xl font-bold text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PI e Agência */}
        {projeto.tipo_cobranca === 'td' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">PI</p>
                {projeto.pi && <Badge variant="outline" className="text-xs">{formatCurrency(projeto.pi.valor_bruto)}</Badge>}
              </div>
              <p className="font-medium">{projeto.pi?.identificador || '-'}</p>
              <p className="text-xs text-muted-foreground mt-3 mb-1">Agência</p>
              <p className="font-medium text-sm">{projeto.agencia?.nome || '-'}</p>
            </CardContent>
          </Card>
        )}

        {/* Grupo de Revisão */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Grupo de Revisão</p>
            {projeto.grupo_revisao ? (
              <div>
                <p className="font-medium">Grupo {projeto.grupo_revisao}</p>
                <p className="text-xs text-muted-foreground">
                  {projeto.grupo_revisao === 'A' ? 'Todos os dias' : projeto.grupo_revisao === 'B' ? 'Segunda, Quarta e Sexta' : 'Terça e Quinta'}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Não definido</p>
            )}
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Links</p>
            <div className="flex flex-col gap-2">
              {projeto.link_proposta && (
                <a href={projeto.link_proposta} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />Proposta
                </a>
              )}
              {projeto.url_destino && (
                <a href={projeto.url_destino} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />URL Destino
                </a>
              )}
              {!projeto.link_proposta && !projeto.url_destino && <p className="text-muted-foreground text-sm">Nenhum link cadastrado</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Financeiro */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Valor Total Bruto</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalValorBruto)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Líquido</p>
              <p className="text-xl font-bold">{formatCurrency(totalLiquido)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gasto Total</p>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(totalGasto)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Restante</p>
              <p className={`text-xl font-bold ${totalRestante < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatCurrency(totalRestante)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estratégias */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" />
            Estratégias ({projeto.estrategias.length})
          </CardTitle>
          <Button size="sm" onClick={() => { resetEstrategiaForm(); setIsEstrategiaOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />Nova
          </Button>
        </CardHeader>
        <CardContent>
          {projeto.estrategias.length > 0 ? (
            <div className="space-y-4">
              {projeto.estrategias.map(estrategia => {
                const calc = calcularValoresEstrategia(estrategia)
                const plataformaLabel = plataformaOptions.find(p => p.value === estrategia.plataforma)?.label || estrategia.plataforma

                return (
                  <Card key={estrategia.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base capitalize">{plataformaLabel}</CardTitle>
                            {getEstrategiaStatusBadge(estrategia.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {estrategia.estrategia && `${estrategia.estrategia} • `}
                            {estrategia.kpi && `KPI: ${estrategia.kpi}`}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingEstrategia(estrategia)
                              setEstrategiaForm({
                                plataforma: estrategia.plataforma,
                                nome_conta: estrategia.nome_conta || '',
                                id_conta: estrategia.id_conta || '',
                                campaign_id: estrategia.campaign_id || '',
                                estrategia: estrategia.estrategia || '',
                                kpi: estrategia.kpi || '',
                                status: estrategia.status,
                                valor_bruto: estrategia.valor_bruto.toString(),
                                porcentagem_agencia: estrategia.porcentagem_agencia.toString(),
                                porcentagem_plataforma: estrategia.porcentagem_plataforma.toString(),
                                entrega_contratada: estrategia.entrega_contratada?.toString() || '',
                                gasto_ate_momento: estrategia.gasto_ate_momento?.toString() || '',
                                entregue_ate_momento: estrategia.entregue_ate_momento?.toString() || '',
                                data_atualizacao: estrategia.data_atualizacao || '',
                              })
                              setIsEstrategiaOpen(true)
                            }}>
                              <Pencil className="h-4 w-4 mr-2" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteEstrategia(estrategia.id.toString())} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Conta Info */}
                      {(estrategia.nome_conta || estrategia.id_conta || estrategia.campaign_id) && (
                        <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
                          {estrategia.nome_conta && <p><strong>Conta:</strong> {estrategia.nome_conta}</p>}
                          {estrategia.id_conta && <p><strong>ID Conta:</strong> {estrategia.id_conta}</p>}
                          {estrategia.campaign_id && <p><strong>Campaign ID:</strong> {estrategia.campaign_id}</p>}
                        </div>
                      )}

                      {/* Valores Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Valor Bruto</p>
                          <p className="font-semibold text-green-600">{formatCurrency(estrategia.valor_bruto)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">% Agência</p>
                          <p className="font-semibold">{estrategia.porcentagem_agencia}%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">% Plataforma</p>
                          <p className="font-semibold">{estrategia.porcentagem_plataforma}%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Valor Líquido</p>
                          <p className="font-semibold">{formatCurrency(calc.valorLiquido)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Por Dia</p>
                          <p className="font-semibold">{calc.valorPorDia ? formatCurrency(calc.valorPorDia) : '-'}</p>
                        </div>
                      </div>

                      {/* Acompanhamento */}
                      {(estrategia.entrega_contratada || estrategia.gasto_ate_momento !== null || estrategia.entregue_ate_momento !== null) && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Acompanhamento
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {estrategia.entrega_contratada && (
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Entrega Contratada</p>
                                <p className="font-semibold">{estrategia.entrega_contratada.toLocaleString('pt-BR')}</p>
                              </div>
                            )}
                            {estrategia.entregue_ate_momento !== null && (
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Entregue</p>
                                <p className="font-semibold">{estrategia.entregue_ate_momento.toLocaleString('pt-BR')}</p>
                                {calc.percentualEntrega !== null && (
                                  <p className="text-xs text-muted-foreground">{calc.percentualEntrega.toFixed(1)}%</p>
                                )}
                              </div>
                            )}
                            {estrategia.gasto_ate_momento !== null && (
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Gasto</p>
                                <p className="font-semibold text-amber-600">{formatCurrency(estrategia.gasto_ate_momento)}</p>
                              </div>
                            )}
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Restante</p>
                              <p className={`font-semibold ${calc.valorRestante < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                {formatCurrency(calc.valorRestante)}
                              </p>
                            </div>
                            {calc.custoResultado !== null && (
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Custo/Resultado</p>
                                <p className="font-semibold">{formatCurrency(calc.custoResultado)}</p>
                              </div>
                            )}
                          </div>
                          {estrategia.data_atualizacao && (
                            <p className="text-xs text-muted-foreground mt-3">
                              Última atualização: {formatDate(estrategia.data_atualizacao)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Estimativas (se houver) */}
                      {(estrategia.estimativa_resultado || estrategia.estimativa_sucesso) && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Estimativas
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            {estrategia.estimativa_resultado && (
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Estimativa de Resultado</p>
                                <p className="font-semibold">{estrategia.estimativa_resultado.toLocaleString('pt-BR')}</p>
                              </div>
                            )}
                            {estrategia.estimativa_sucesso && (
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Estimativa de Sucesso</p>
                                <p className="font-semibold">{estrategia.estimativa_sucesso}%</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Nenhuma estratégia cadastrada</h3>
              <p className="text-muted-foreground mt-1">Adicione estratégias de mídia para este projeto</p>
              <Button className="mt-4" onClick={() => { resetEstrategiaForm(); setIsEstrategiaOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />Adicionar Estratégia
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição do Projeto */}
      <Dialog open={isProjetoOpen} onOpenChange={open => { setIsProjetoOpen(open); if (!open) resetProjetoForm() }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmitProjeto}>
            <DialogHeader>
              <DialogTitle>Editar Projeto</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome do Projeto *</Label>
                <Input
                  value={projetoForm.nome}
                  onChange={e => setProjetoForm(p => ({ ...p, nome: e.target.value }))}
                  placeholder="Nome do projeto"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Cliente *</Label>
                <SearchableSelect
                  options={clientes.map(c => ({ value: c.id.toString(), label: c.nome }))}
                  value={projetoForm.cliente_id?.toString() || ''}
                  onValueChange={v => setProjetoForm(p => ({ ...p, cliente_id: v ? parseInt(v) : p.cliente_id }))}
                  placeholder="Selecione o cliente"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Cobrança</Label>
                <Select value={projetoForm.tipo_cobranca} onValueChange={v => setProjetoForm(p => ({ ...p, tipo_cobranca: v as TipoCobranca }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tipoCobrancaOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {!isFee && (
                <>
                  <div className="space-y-2">
                    <Label>PI</Label>
                    <SearchableSelect
                      options={pis.map(p => ({ value: p.id.toString(), label: p.identificador, description: formatCurrency(p.valor_bruto) }))}
                      value={projetoForm.pi_id?.toString() || ''}
                      onValueChange={v => setProjetoForm(p => ({ ...p, pi_id: v ? parseInt(v) : null }))}
                      placeholder="Selecione o PI"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Agência</Label>
                    <Select value={projetoForm.agencia_id?.toString() || ''} onValueChange={v => setProjetoForm(p => ({ ...p, agencia_id: v ? parseInt(v) : null }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {agencias.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={projetoForm.status} onValueChange={v => setProjetoForm(p => ({ ...p, status: v as StatusProjeto }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusProjetoOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input type="date" value={projetoForm.data_inicio} onChange={e => setProjetoForm(p => ({ ...p, data_inicio: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input type="date" value={projetoForm.data_fim} onChange={e => setProjetoForm(p => ({ ...p, data_fim: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Trader (Responsável)</Label>
                <Select value={projetoForm.trader_id?.toString() || ''} onValueChange={v => setProjetoForm(p => ({ ...p, trader_id: v ? parseInt(v) : null }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {traders.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Colaborador</Label>
                <Select value={projetoForm.colaborador_id?.toString() || ''} onValueChange={v => setProjetoForm(p => ({ ...p, colaborador_id: v ? parseInt(v) : null }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {traders.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Grupo de Revisão</Label>
                <Select value={projetoForm.grupo_revisao || ''} onValueChange={v => setProjetoForm(p => ({ ...p, grupo_revisao: v ? v as GrupoRevisao : null }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
                  <SelectContent>
                    {grupoRevisaoOptions.map(g => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label} - {g.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Link Proposta</Label>
                <Input value={projetoForm.link_proposta} onChange={e => setProjetoForm(p => ({ ...p, link_proposta: e.target.value }))} placeholder="https://..." />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>URL Destino</Label>
                <Input value={projetoForm.url_destino} onChange={e => setProjetoForm(p => ({ ...p, url_destino: e.target.value }))} placeholder="https://..." />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsProjetoOpen(false); resetProjetoForm() }}>Cancelar</Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isLoading}
                onClick={(e) => handleSubmitProjeto(e as unknown as React.FormEvent, false)}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar e Continuar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar e Fechar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Estratégia */}
      <Dialog open={isEstrategiaOpen} onOpenChange={open => { setIsEstrategiaOpen(open); if (!open) resetEstrategiaForm() }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmitEstrategia}>
            <DialogHeader>
              <DialogTitle>{editingEstrategia ? 'Editar Estratégia' : 'Nova Estratégia'}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              <div className="space-y-2">
                <Label>Plataforma *</Label>
                <Select value={estrategiaForm.plataforma} onValueChange={v => setEstrategiaForm(p => ({ ...p, plataforma: v as Plataforma }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {plataformaOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {estrategiaForm.plataforma && (
                <>
                  <div className="space-y-2">
                    <Label>Nome da Conta *</Label>
                    <Input
                      value={estrategiaForm.nome_conta}
                      onChange={e => setEstrategiaForm(p => ({ ...p, nome_conta: e.target.value }))}
                      placeholder="Ex: Cliente ABC - Conta Principal"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ID da Conta *</Label>
                    <Input
                      value={estrategiaForm.id_conta}
                      onChange={e => setEstrategiaForm(p => ({ ...p, id_conta: e.target.value }))}
                      placeholder="Ex: 123456789"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Campaign ID</Label>
                    <Input
                      value={estrategiaForm.campaign_id}
                      onChange={e => setEstrategiaForm(p => ({ ...p, campaign_id: e.target.value }))}
                      placeholder="ID da campanha na plataforma"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Estratégia *</Label>
                <Select value={estrategiaForm.estrategia} onValueChange={v => setEstrategiaForm(p => ({ ...p, estrategia: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {estrategiaOptions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>KPI *</Label>
                <Select value={estrategiaForm.kpi} onValueChange={v => setEstrategiaForm(p => ({ ...p, kpi: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {kpiOptions.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={estrategiaForm.status} onValueChange={v => setEstrategiaForm(p => ({ ...p, status: v as StatusEstrategia }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusEstrategiaOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valor Bruto (R$)</Label>
                <Input type="number" step="0.01" value={estrategiaForm.valor_bruto} onChange={e => setEstrategiaForm(p => ({ ...p, valor_bruto: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>% Agência</Label>
                <Input type="number" step="0.01" max="100" placeholder="0" value={estrategiaForm.porcentagem_agencia} onChange={e => setEstrategiaForm(p => ({ ...p, porcentagem_agencia: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>% Plataforma</Label>
                <Input type="number" step="0.01" max="100" placeholder="0" value={estrategiaForm.porcentagem_plataforma} onChange={e => setEstrategiaForm(p => ({ ...p, porcentagem_plataforma: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Entrega Contratada</Label>
                <Input type="number" step="0.01" value={estrategiaForm.entrega_contratada} onChange={e => setEstrategiaForm(p => ({ ...p, entrega_contratada: e.target.value }))} />
              </div>

              {/* Campos de Acompanhamento */}
              <div className="md:col-span-3 border-t pt-4 mt-2">
                <p className="text-sm font-medium text-muted-foreground mb-3">Acompanhamento (atualizado pelo trader)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Gasto até o Momento (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={estrategiaForm.gasto_ate_momento}
                      onChange={e => setEstrategiaForm(p => ({ ...p, gasto_ate_momento: e.target.value }))}
                      className="border-amber-300 focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Entregue até o Momento</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={estrategiaForm.entregue_ate_momento}
                      onChange={e => setEstrategiaForm(p => ({ ...p, entregue_ate_momento: e.target.value }))}
                      className="border-amber-300 focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Atualização</Label>
                    <Input
                      type="date"
                      value={estrategiaForm.data_atualizacao}
                      onChange={e => setEstrategiaForm(p => ({ ...p, data_atualizacao: e.target.value }))}
                      className="border-amber-300 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsEstrategiaOpen(false); resetEstrategiaForm() }}>Cancelar</Button>
              <Button type="submit" disabled={isLoading || !estrategiaForm.plataforma || !estrategiaForm.nome_conta || !estrategiaForm.id_conta}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingEstrategia ? 'Salvar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
