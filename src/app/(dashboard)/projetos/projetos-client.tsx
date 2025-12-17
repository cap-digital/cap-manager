'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  FolderKanban,
  User,
  Calendar,
  DollarSign,
  Search,
  Loader2,
  Clock,
  Building2,
  ChevronRight,
  ArrowLeft,
  Layers,
  X,
  Eye,
  ExternalLink,
} from 'lucide-react'
import { formatCurrency, formatDate, formatDateInput } from '@/lib/utils'

type TipoCobranca = 'td' | 'fee'
type StatusProjeto = 'rascunho' | 'ativo' | 'pausado' | 'finalizado' | 'cancelado'
type StatusEstrategia = 'planejada' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada'
type Plataforma = 'meta' | 'google' | 'tiktok' | 'linkedin' | 'twitter' | 'pinterest' | 'spotify' | 'programatica' | 'outro'

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
  estrategias_count: number
  estrategias: SimplifiedEstrategia[]
  created_at: string
  updated_at: string
  cliente: { id: number; nome: string } | null
  trader: { id: number; nome: string } | null
  colaborador: { id: number; nome: string } | null
}

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

const statusEstrategiaOptions: { value: StatusEstrategia; label: string; color: string }[] = [
  { value: 'planejada', label: 'Planejada', color: 'secondary' },
  { value: 'ativa', label: 'Ativa', color: 'success' },
  { value: 'pausada', label: 'Pausada', color: 'warning' },
  { value: 'finalizada', label: 'Finalizada', color: 'default' },
  { value: 'cancelada', label: 'Cancelada', color: 'destructive' },
]

const tipoCobrancaOptions: { value: TipoCobranca; label: string }[] = [
  { value: 'td', label: 'TD (Trading Desk)' },
  { value: 'fee', label: 'FEE' },
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

const kpiOptions = [
  'CPA',
  'CPC',
  'CPM',
  'CPL',
  'CPV',
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
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [currentProjetoId, setCurrentProjetoId] = useState<number | null>(null)

  // Estrategia form state
  const [isEstrategiaOpen, setIsEstrategiaOpen] = useState(false)
  const [editingEstrategia, setEditingEstrategia] = useState<SimplifiedEstrategia | null>(null)

  // View project details state
  const [viewingProjeto, setViewingProjeto] = useState<SimplifiedProjeto | null>(null)

  const [formData, setFormData] = useState({
    cliente_id: null as number | null,
    nome: '',
    pi_id: null as number | null,
    tipo_cobranca: 'td' as TipoCobranca,
    agencia_id: null as number | null,
    trader_id: null as number | null,
    colaborador_id: null as number | null,
    status: 'rascunho' as StatusProjeto,
    data_inicio: '',
    data_fim: '',
    link_proposta: '',
    url_destino: '',
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
    porcentagem_agencia: 0,
    porcentagem_plataforma: 0,
    entrega_contratada: '',
    estimativa_resultado: '',
    estimativa_sucesso: '',
    gasto_ate_momento: '',
    entregue_ate_momento: '',
    data_atualizacao: '',
  })

  const router = useRouter()
  const { toast } = useToast()

  // Calcular dias
  const calcularDiasVeiculacao = useMemo(() => {
    if (!formData.data_inicio || !formData.data_fim) return null
    const inicio = new Date(formData.data_inicio)
    const fim = new Date(formData.data_fim)
    const diff = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : null
  }, [formData.data_inicio, formData.data_fim])

  const calcularDiasAteAcabar = useMemo(() => {
    if (!formData.data_fim) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const fim = new Date(formData.data_fim)
    const diff = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }, [formData.data_fim])

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

  const resetForm = () => {
    setFormData({
      cliente_id: null,
      nome: '',
      pi_id: null,
      tipo_cobranca: 'td',
      agencia_id: null,
      trader_id: null,
      colaborador_id: null,
      status: 'rascunho',
      data_inicio: '',
      data_fim: '',
      link_proposta: '',
      url_destino: '',
    })
    setEditingProjeto(null)
    setStep(1)
    setCurrentProjetoId(null)
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
      porcentagem_agencia: 0,
      porcentagem_plataforma: 0,
      entrega_contratada: '',
      estimativa_resultado: '',
      estimativa_sucesso: '',
      gasto_ate_momento: '',
      entregue_ate_momento: '',
      data_atualizacao: '',
    })
    setEditingEstrategia(null)
  }

  const openEditDialog = (projeto: SimplifiedProjeto) => {
    setEditingProjeto(projeto)
    setFormData({
      cliente_id: projeto.cliente_id,
      nome: projeto.nome,
      pi_id: projeto.pi_id,
      tipo_cobranca: projeto.tipo_cobranca || 'td',
      agencia_id: projeto.agencia_id,
      trader_id: projeto.trader_id,
      colaborador_id: projeto.colaborador_id,
      status: projeto.status,
      data_inicio: projeto.data_inicio || '',
      data_fim: projeto.data_fim || '',
      link_proposta: projeto.link_proposta || '',
      url_destino: projeto.url_destino || '',
    })
    setCurrentProjetoId(projeto.id)
    setStep(1)
    setIsOpen(true)
  }

  const handleSubmitProjeto = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Se for FEE, não envia PI e Agência
    const isFee = formData.tipo_cobranca === 'fee'
    const payload = {
      cliente_id: formData.cliente_id,
      nome: formData.nome,
      pi_id: isFee ? null : (formData.pi_id || null),
      tipo_cobranca: formData.tipo_cobranca,
      agencia_id: isFee ? null : (formData.agencia_id || null),
      trader_id: formData.trader_id || null,
      colaborador_id: formData.colaborador_id || null,
      status: formData.status,
      data_inicio: formData.data_inicio || null,
      data_fim: formData.data_fim || null,
      link_proposta: formData.link_proposta || null,
      url_destino: formData.url_destino || null,
    }

    try {
      let projetoId = currentProjetoId

      if (editingProjeto) {
        const response = await fetch(`/api/projetos?id=${editingProjeto.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Erro ao atualizar projeto')
        toast({ title: 'Projeto atualizado!' })
      } else {
        const response = await fetch('/api/projetos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Erro ao criar projeto')
        projetoId = result.id
        toast({ title: 'Projeto criado! Agora adicione as estrategias.' })
      }

      setCurrentProjetoId(projetoId)
      setStep(2)
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
    if (!currentProjetoId) return
    setIsLoading(true)

    const payload = {
      projeto_id: currentProjetoId,
      plataforma: estrategiaForm.plataforma,
      nome_conta: estrategiaForm.nome_conta || null,
      id_conta: estrategiaForm.id_conta || null,
      campaign_id: estrategiaForm.campaign_id || null,
      estrategia: estrategiaForm.estrategia || null,
      kpi: estrategiaForm.kpi || null,
      status: estrategiaForm.status,
      valor_bruto: estrategiaForm.valor_bruto ? parseFloat(estrategiaForm.valor_bruto) : 0,
      porcentagem_agencia: estrategiaForm.porcentagem_agencia,
      porcentagem_plataforma: estrategiaForm.porcentagem_plataforma,
      entrega_contratada: estrategiaForm.entrega_contratada ? parseFloat(estrategiaForm.entrega_contratada) : null,
      estimativa_resultado: estrategiaForm.estimativa_resultado ? parseFloat(estrategiaForm.estimativa_resultado) : null,
      estimativa_sucesso: estrategiaForm.estimativa_sucesso ? parseFloat(estrategiaForm.estimativa_sucesso) : null,
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
        toast({ title: 'Estrategia atualizada!' })
      } else {
        const response = await fetch('/api/estrategias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error('Erro ao criar estrategia')
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

  const handleDeleteProjeto = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este projeto e todas as estrategias?')) return

    try {
      const response = await fetch(`/api/projetos?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao excluir projeto')
      setProjetos(prev => prev.filter(p => p.id !== parseInt(id)))
      toast({ title: 'Projeto excluido!' })
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro'
      toast({ variant: 'destructive', title: 'Erro', description: errorMessage })
    }
  }

  const handleDeleteEstrategia = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta estrategia?')) return

    try {
      const response = await fetch(`/api/estrategias?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao excluir estrategia')
      toast({ title: 'Estrategia excluida!' })
      router.refresh()
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

  // Calculos para Estrategia
  // Valor Líquido = Valor Bruto - (Valor Bruto * % Agência / 100)
  // Valor Plataforma = Valor Líquido * % Plataforma / 100
  // Valor Por Dia = Valor Plataforma / Dias Totais do Projeto
  // Valor Restante = Valor Plataforma - Gasto Até o Momento
  const calcularValoresEstrategia = (e: SimplifiedEstrategia) => {
    const valorLiquido = e.valor_bruto - (e.valor_bruto * e.porcentagem_agencia / 100)
    const valorPlataforma = valorLiquido * (e.porcentagem_plataforma / 100)

    // Pegar o projeto atual
    const projeto = projetos.find(p => p.id === e.projeto_id)
    const diasVeiculacao = projeto?.data_inicio && projeto?.data_fim
      ? Math.ceil((new Date(projeto.data_fim).getTime() - new Date(projeto.data_inicio).getTime()) / (1000 * 60 * 60 * 24))
      : null

    const valorPorDia = diasVeiculacao && diasVeiculacao > 0 ? valorPlataforma / diasVeiculacao : null
    const percentualEntrega = e.entrega_contratada && e.entregue_ate_momento
      ? (e.entregue_ate_momento / e.entrega_contratada) * 100
      : null
    const valorRestante = e.gasto_ate_momento !== null ? valorPlataforma - e.gasto_ate_momento : valorPlataforma
    const custoResultado = e.entregue_ate_momento && e.gasto_ate_momento
      ? e.gasto_ate_momento / e.entregue_ate_momento
      : null

    return { valorLiquido, valorPlataforma, valorPorDia, percentualEntrega, valorRestante, custoResultado, diasVeiculacao }
  }

  const currentProjeto = currentProjetoId ? projetos.find(p => p.id === currentProjetoId) : null

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {statusProjetoOptions.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={traderFilter} onValueChange={setTraderFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Trader" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos traders</SelectItem>
              {traders.map(t => (
                <SelectItem key={t.id} value={t.id.toString()}>{t.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={agenciaFilter} onValueChange={setAgenciaFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Agência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas agências</SelectItem>
              {agencias.map(a => (
                <SelectItem key={a.id} value={a.id.toString()}>{a.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={piFilter} onValueChange={setPiFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="PI" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos PIs</SelectItem>
              {pis.map(p => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.identificador}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">De:</Label>
            <Input
              type="date"
              value={dataInicioFilter}
              onChange={e => setDataInicioFilter(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Até:</Label>
            <Input
              type="date"
              value={dataFimFilter}
              onChange={e => setDataFimFilter(e.target.value)}
              className="w-[150px]"
            />
          </div>
          {(dataInicioFilter || dataFimFilter || traderFilter !== 'all' || agenciaFilter !== 'all' || piFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDataInicioFilter('')
                setDataFimFilter('')
                setTraderFilter('all')
                setAgenciaFilter('all')
                setPiFilter('all')
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        <Dialog open={isOpen} onOpenChange={open => { setIsOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Projeto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            {/* Step Indicator */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex items-center gap-2 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-primary text-white' : 'bg-muted'}`}>1</div>
                <span className="font-medium">Dados do Projeto</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <div className={`flex items-center gap-2 ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-primary text-white' : 'bg-muted'}`}>2</div>
                <span className="font-medium">Estrategias</span>
              </div>
            </div>

            {step === 1 ? (
              <form onSubmit={handleSubmitProjeto}>
                <DialogHeader>
                  <DialogTitle>{editingProjeto ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
                  <DialogDescription>Preencha os dados basicos do projeto</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome do Cliente *</Label>
                    <Select value={formData.cliente_id?.toString() || ''} onValueChange={v => setFormData(p => ({ ...p, cliente_id: v ? parseInt(v) : null }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {clientes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>TD ou FEE *</Label>
                    <Select value={formData.tipo_cobranca} onValueChange={v => setFormData(p => ({ ...p, tipo_cobranca: v as TipoCobranca }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {tipoCobrancaOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* PI - Apenas para TD */}
                  {formData.tipo_cobranca === 'td' && (
                    <div className="space-y-2">
                      <Label>PI - Autorizacao</Label>
                      <Select value={formData.pi_id?.toString() || ''} onValueChange={v => setFormData(p => ({ ...p, pi_id: v ? parseInt(v) : null }))}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {pis.map(pi => <SelectItem key={pi.id} value={pi.id.toString()}>{pi.identificador} - {formatCurrency(pi.valor_bruto)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <Label>Nome do Projeto *</Label>
                    <Input value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as StatusProjeto }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusProjetoOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <div className="flex items-center gap-2">
                      <Input type="date" value={formData.data_inicio} onChange={e => setFormData(p => ({ ...p, data_inicio: e.target.value }))} className="flex-1" />
                      {formData.data_inicio && <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDateInput(formData.data_inicio)}</span>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Fim</Label>
                    <div className="flex items-center gap-2">
                      <Input type="date" value={formData.data_fim} onChange={e => setFormData(p => ({ ...p, data_fim: e.target.value }))} className="flex-1" />
                      {formData.data_fim && <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDateInput(formData.data_fim)}</span>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Qtde Dias de Veiculacao</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{calcularDiasVeiculacao !== null ? `${calcularDiasVeiculacao} dias` : '-'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dias Ate Acabar</Label>
                    <div className={`flex items-center h-10 px-3 rounded-md border ${calcularDiasAteAcabar !== null && calcularDiasAteAcabar <= 7 ? 'bg-red-100 border-red-300' : 'bg-muted'}`}>
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className={`text-sm ${calcularDiasAteAcabar !== null && calcularDiasAteAcabar <= 7 ? 'text-red-600 font-medium' : ''}`}>
                        {calcularDiasAteAcabar !== null ? (calcularDiasAteAcabar < 0 ? 'Encerrada' : `${calcularDiasAteAcabar} dias`) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Agência - Apenas para TD */}
                  {formData.tipo_cobranca === 'td' && (
                    <div className="space-y-2">
                      <Label>Agencia</Label>
                      <Select value={formData.agencia_id?.toString() || ''} onValueChange={v => setFormData(p => ({ ...p, agencia_id: v ? parseInt(v) : null }))}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {agencias.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Link Proposta</Label>
                    <Input value={formData.link_proposta} onChange={e => setFormData(p => ({ ...p, link_proposta: e.target.value }))} placeholder="https://..." />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>URL Destino</Label>
                    <Input value={formData.url_destino} onChange={e => setFormData(p => ({ ...p, url_destino: e.target.value }))} placeholder="https://..." />
                  </div>

                  <div className="space-y-2">
                    <Label>Trader (Responsável)</Label>
                    <Select value={formData.trader_id?.toString() || ''} onValueChange={v => setFormData(p => ({ ...p, trader_id: v ? parseInt(v) : null }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {traders.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Colaborador</Label>
                    <Select value={formData.colaborador_id?.toString() || ''} onValueChange={v => setFormData(p => ({ ...p, colaborador_id: v ? parseInt(v) : null }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {traders.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setIsOpen(false); resetForm() }}>Cancelar</Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingProjeto ? 'Salvar e Continuar' : 'Criar e Continuar'}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div>
                <DialogHeader>
                  <DialogTitle>Estrategias do Projeto</DialogTitle>
                  <DialogDescription>Adicione as linhas de estrategia de midia para este projeto</DialogDescription>
                </DialogHeader>

                <div className="py-4">
                  {/* Indicador de Valor do PI (apenas para TD) */}
                  {currentProjeto && currentProjeto.tipo_cobranca === 'td' && currentProjeto.pi && (
                    <div className="mb-4 p-4 rounded-lg bg-muted">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">PI: {currentProjeto.pi.identificador}</p>
                          <p className="text-lg font-semibold">Valor Total: {formatCurrency(currentProjeto.pi.valor_bruto)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Alocado nas Estratégias</p>
                          <p className="text-lg font-semibold">{formatCurrency(currentProjeto.estrategias.reduce((acc, e) => acc + e.valor_bruto, 0))}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Restante</p>
                          {(() => {
                            const valorAlocado = currentProjeto.estrategias.reduce((acc, e) => acc + e.valor_bruto, 0)
                            const valorRestante = currentProjeto.pi.valor_bruto - valorAlocado
                            const isNegativo = valorRestante < 0
                            return (
                              <p className={`text-lg font-semibold ${isNegativo ? 'text-red-600' : valorRestante > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                {formatCurrency(valorRestante)}
                                {valorRestante > 0 && <span className="text-sm font-normal ml-2">(adicione mais estratégias)</span>}
                                {isNegativo && <span className="text-sm font-normal ml-2">(excedeu o PI!)</span>}
                              </p>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-4">
                    <Button variant="ghost" onClick={() => setStep(1)}>
                      <ArrowLeft className="h-4 w-4 mr-2" />Voltar aos Dados
                    </Button>
                    <Button onClick={() => { resetEstrategiaForm(); setIsEstrategiaOpen(true) }}>
                      <Plus className="h-4 w-4 mr-2" />Nova Estratégia
                    </Button>
                  </div>

                  {currentProjeto && currentProjeto.estrategias.length > 0 ? (
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plataforma</TableHead>
                            <TableHead>Estrategia</TableHead>
                            <TableHead>KPI</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Valor Bruto</TableHead>
                            <TableHead className="text-right">% Ag.</TableHead>
                            <TableHead className="text-right">% Plat.</TableHead>
                            <TableHead className="text-right">Valor Liq.</TableHead>
                            <TableHead className="text-right">Gasto</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentProjeto.estrategias.map(e => {
                            const calc = calcularValoresEstrategia(e)
                            return (
                              <TableRow key={e.id}>
                                <TableCell className="font-medium capitalize">{e.plataforma}</TableCell>
                                <TableCell>{e.estrategia || '-'}</TableCell>
                                <TableCell>{e.kpi || '-'}</TableCell>
                                <TableCell>
                                  <Badge variant={statusEstrategiaOptions.find(s => s.value === e.status)?.color as 'default'}>
                                    {statusEstrategiaOptions.find(s => s.value === e.status)?.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(e.valor_bruto)}</TableCell>
                                <TableCell className="text-right">{e.porcentagem_agencia}%</TableCell>
                                <TableCell className="text-right">{e.porcentagem_plataforma}%</TableCell>
                                <TableCell className="text-right">{formatCurrency(calc.valorLiquido)}</TableCell>
                                <TableCell className="text-right">{e.gasto_ate_momento !== null ? formatCurrency(e.gasto_ate_momento) : '-'}</TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setEditingEstrategia(e)
                                        setEstrategiaForm({
                                          plataforma: e.plataforma,
                                          nome_conta: e.nome_conta || '',
                                          id_conta: e.id_conta || '',
                                          campaign_id: e.campaign_id || '',
                                          estrategia: e.estrategia || '',
                                          kpi: e.kpi || '',
                                          status: e.status,
                                          valor_bruto: e.valor_bruto.toString(),
                                          porcentagem_agencia: e.porcentagem_agencia,
                                          porcentagem_plataforma: e.porcentagem_plataforma,
                                          entrega_contratada: e.entrega_contratada?.toString() || '',
                                          estimativa_resultado: e.estimativa_resultado?.toString() || '',
                                          estimativa_sucesso: e.estimativa_sucesso?.toString() || '',
                                          gasto_ate_momento: e.gasto_ate_momento?.toString() || '',
                                          entregue_ate_momento: e.entregue_ate_momento?.toString() || '',
                                          data_atualizacao: e.data_atualizacao || '',
                                        })
                                        setIsEstrategiaOpen(true)
                                      }}>
                                        <Pencil className="h-4 w-4 mr-2" />Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteEstrategia(e.id.toString())} className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12 border rounded-lg">
                      <Layers className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <h3 className="mt-4 text-lg font-semibold">Nenhuma estrategia</h3>
                      <p className="text-muted-foreground">Adicione estrategias de midia para este projeto</p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button onClick={() => { setIsOpen(false); resetForm() }}>Finalizar</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Estrategia */}
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
                      <Label>Campaign ID *</Label>
                      <Input
                        value={estrategiaForm.campaign_id}
                        onChange={e => setEstrategiaForm(p => ({ ...p, campaign_id: e.target.value }))}
                        placeholder="ID da campanha na plataforma"
                        required
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
                  <Input type="number" step="0.01" max="100" value={estrategiaForm.porcentagem_agencia} onChange={e => setEstrategiaForm(p => ({ ...p, porcentagem_agencia: parseFloat(e.target.value) || 0 }))} />
                </div>

                <div className="space-y-2">
                  <Label>% Plataforma</Label>
                  <Input type="number" step="0.01" max="100" value={estrategiaForm.porcentagem_plataforma} onChange={e => setEstrategiaForm(p => ({ ...p, porcentagem_plataforma: parseFloat(e.target.value) || 0 }))} />
                </div>

                <div className="space-y-2">
                  <Label>Entrega Contratada</Label>
                  <Input type="number" step="0.01" value={estrategiaForm.entrega_contratada} onChange={e => setEstrategiaForm(p => ({ ...p, entrega_contratada: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Estimativa de Resultado</Label>
                  <Input type="number" step="0.01" value={estrategiaForm.estimativa_resultado} onChange={e => setEstrategiaForm(p => ({ ...p, estimativa_resultado: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Estimativa de Sucesso (%)</Label>
                  <Input type="number" step="0.01" max="100" value={estrategiaForm.estimativa_sucesso} onChange={e => setEstrategiaForm(p => ({ ...p, estimativa_sucesso: e.target.value }))} />
                </div>

                {/* Campos de Acompanhamento em destaque */}
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
                <Button type="submit" disabled={isLoading || !estrategiaForm.plataforma || !estrategiaForm.nome_conta || !estrategiaForm.id_conta || !estrategiaForm.campaign_id}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingEstrategia ? 'Salvar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de Visualização do Projeto */}
        <Dialog open={!!viewingProjeto} onOpenChange={open => { if (!open) setViewingProjeto(null) }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            {viewingProjeto && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-xl">{viewingProjeto.nome}</DialogTitle>
                      <DialogDescription className="flex items-center gap-2 mt-1">
                        <span>{viewingProjeto.cliente?.nome || 'Sem cliente'}</span>
                        <span className="text-muted-foreground">|</span>
                        {getStatusBadge(viewingProjeto.status)}
                      </DialogDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setViewingProjeto(null); openEditDialog(viewingProjeto) }}>
                      <Pencil className="h-4 w-4 mr-2" />Editar Projeto
                    </Button>
                  </div>
                </DialogHeader>

                {/* Info do Projeto */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="font-medium">{viewingProjeto.tipo_cobranca?.toUpperCase() || 'TD'}</p>
                  </div>
                  {viewingProjeto.pi && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">PI</p>
                      <p className="font-medium">{viewingProjeto.pi.identificador}</p>
                    </div>
                  )}
                  {viewingProjeto.trader && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Trader</p>
                      <p className="font-medium">{viewingProjeto.trader.nome}</p>
                    </div>
                  )}
                  {viewingProjeto.agencia && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Agência</p>
                      <p className="font-medium">{viewingProjeto.agencia.nome}</p>
                    </div>
                  )}
                  {viewingProjeto.data_inicio && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Data Início</p>
                      <p className="font-medium">{formatDate(viewingProjeto.data_inicio)}</p>
                    </div>
                  )}
                  {viewingProjeto.data_fim && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Data Fim</p>
                      <p className="font-medium">{formatDate(viewingProjeto.data_fim)}</p>
                    </div>
                  )}
                  {viewingProjeto.colaborador && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Colaborador</p>
                      <p className="font-medium">{viewingProjeto.colaborador.nome}</p>
                    </div>
                  )}
                </div>

                {/* Resumo de Valores */}
                <div className="p-4 bg-muted rounded-lg my-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Total Bruto</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(viewingProjeto.estrategias.reduce((acc, e) => acc + e.valor_bruto, 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gasto Total</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(viewingProjeto.estrategias.reduce((acc, e) => acc + (e.gasto_ate_momento || 0), 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estratégias</p>
                      <p className="text-lg font-semibold">{viewingProjeto.estrategias.length}</p>
                    </div>
                    {viewingProjeto.data_fim && (
                      <div>
                        <p className="text-sm text-muted-foreground">Dias Restantes</p>
                        {(() => {
                          const dias = getDiasAteAcabar(viewingProjeto.data_fim)
                          return (
                            <p className={`text-lg font-semibold ${dias !== null && dias <= 7 && dias >= 0 ? 'text-red-600' : ''}`}>
                              {dias !== null ? (dias < 0 ? 'Encerrado' : `${dias} dias`) : '-'}
                            </p>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabela de Estratégias */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Estratégias
                    </h3>
                    <Button size="sm" onClick={() => {
                      setCurrentProjetoId(viewingProjeto.id)
                      resetEstrategiaForm()
                      setIsEstrategiaOpen(true)
                    }}>
                      <Plus className="h-4 w-4 mr-2" />Nova Estratégia
                    </Button>
                  </div>

                  {viewingProjeto.estrategias.length > 0 ? (
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plataforma</TableHead>
                            <TableHead>Conta</TableHead>
                            <TableHead>Estratégia</TableHead>
                            <TableHead>KPI</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Valor Bruto</TableHead>
                            <TableHead className="text-right">% Ag.</TableHead>
                            <TableHead className="text-right">% Plat.</TableHead>
                            <TableHead className="text-right">Valor Líq.</TableHead>
                            <TableHead className="text-right">Gasto</TableHead>
                            <TableHead className="text-right">Entregue</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewingProjeto.estrategias.map(e => {
                            const calc = calcularValoresEstrategia(e)
                            return (
                              <TableRow key={e.id}>
                                <TableCell className="font-medium capitalize">{e.plataforma}</TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-sm truncate max-w-[120px]">{e.nome_conta || '-'}</p>
                                    {e.id_conta && <p className="text-xs text-muted-foreground">ID: {e.id_conta}</p>}
                                  </div>
                                </TableCell>
                                <TableCell>{e.estrategia || '-'}</TableCell>
                                <TableCell>{e.kpi || '-'}</TableCell>
                                <TableCell>
                                  <Badge variant={statusEstrategiaOptions.find(s => s.value === e.status)?.color as 'default'}>
                                    {statusEstrategiaOptions.find(s => s.value === e.status)?.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(e.valor_bruto)}</TableCell>
                                <TableCell className="text-right">{e.porcentagem_agencia}%</TableCell>
                                <TableCell className="text-right">{e.porcentagem_plataforma}%</TableCell>
                                <TableCell className="text-right">{formatCurrency(calc.valorLiquido)}</TableCell>
                                <TableCell className="text-right">{e.gasto_ate_momento !== null ? formatCurrency(e.gasto_ate_momento) : '-'}</TableCell>
                                <TableCell className="text-right">{e.entregue_ate_momento !== null ? e.entregue_ate_momento.toLocaleString('pt-BR') : '-'}</TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setCurrentProjetoId(viewingProjeto.id)
                                        setEditingEstrategia(e)
                                        setEstrategiaForm({
                                          plataforma: e.plataforma,
                                          nome_conta: e.nome_conta || '',
                                          id_conta: e.id_conta || '',
                                          campaign_id: e.campaign_id || '',
                                          estrategia: e.estrategia || '',
                                          kpi: e.kpi || '',
                                          status: e.status,
                                          valor_bruto: e.valor_bruto.toString(),
                                          porcentagem_agencia: e.porcentagem_agencia,
                                          porcentagem_plataforma: e.porcentagem_plataforma,
                                          entrega_contratada: e.entrega_contratada?.toString() || '',
                                          estimativa_resultado: e.estimativa_resultado?.toString() || '',
                                          estimativa_sucesso: e.estimativa_sucesso?.toString() || '',
                                          gasto_ate_momento: e.gasto_ate_momento?.toString() || '',
                                          entregue_ate_momento: e.entregue_ate_momento?.toString() || '',
                                          data_atualizacao: e.data_atualizacao || '',
                                        })
                                        setIsEstrategiaOpen(true)
                                      }}>
                                        <Pencil className="h-4 w-4 mr-2" />Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteEstrategia(e.id.toString())} className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-lg">
                      <Layers className="h-10 w-10 mx-auto text-muted-foreground/50" />
                      <p className="mt-2 text-muted-foreground">Nenhuma estratégia cadastrada</p>
                      <Button className="mt-4" size="sm" onClick={() => {
                        setCurrentProjetoId(viewingProjeto.id)
                        resetEstrategiaForm()
                        setIsEstrategiaOpen(true)
                      }}>
                        <Plus className="h-4 w-4 mr-2" />Adicionar Estratégia
                      </Button>
                    </div>
                  )}
                </div>

                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setViewingProjeto(null)}>Fechar</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Projetos List */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Cards</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          {filteredProjetos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjetos.map(projeto => {
                const diasAteAcabar = getDiasAteAcabar(projeto.data_fim)
                const totalValorBruto = projeto.estrategias.reduce((acc, e) => acc + e.valor_bruto, 0)
                return (
                  <Card key={projeto.id} className="group cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewingProjeto(projeto)}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(projeto.status)}
                          {diasAteAcabar !== null && diasAteAcabar <= 7 && diasAteAcabar >= 0 && (
                            <Badge variant="destructive" className="text-xs">{diasAteAcabar}d restantes</Badge>
                          )}
                        </div>
                        <CardTitle className="text-base line-clamp-2">{projeto.nome}</CardTitle>
                        <CardDescription>{projeto.cliente?.nome || 'Sem cliente'}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); setViewingProjeto(projeto) }}>
                            <Eye className="h-4 w-4 mr-2" />Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); openEditDialog(projeto) }}>
                            <Pencil className="h-4 w-4 mr-2" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); handleDeleteProjeto(projeto.id.toString()) }} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {projeto.trader && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="truncate">{projeto.trader.nome}</span>
                          </div>
                        )}
                        {projeto.agencia && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{projeto.agencia.nome}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Layers className="h-3 w-3" />
                          <span>{projeto.estrategias_count} estrategia(s)</span>
                        </div>
                        {projeto.data_inicio && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(projeto.data_inicio)}
                          </div>
                        )}
                      </div>

                      {totalValorBruto > 0 && (
                        <div className="flex items-center gap-1 text-green-600 font-medium text-sm">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(totalValorBruto)}
                        </div>
                      )}

                      <div className="pt-2 border-t space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {projeto.tipo_cobranca?.toUpperCase() || 'TD'}
                          {projeto.pi && ` | PI: ${projeto.pi.identificador}`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum projeto encontrado</h3>
                <p className="text-muted-foreground mt-2">
                  {search || statusFilter !== 'all' ? 'Tente ajustar os filtros' : 'Comece criando seu primeiro projeto'}
                </p>
                {!search && statusFilter === 'all' && (
                  <Button className="mt-4" onClick={() => setIsOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Criar Projeto
                  </Button>
                )}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="list">
          {filteredProjetos.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Projeto</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Cliente</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Trader</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium hidden sm:table-cell">Estrategias</th>
                    <th className="text-right p-4 font-medium hidden md:table-cell">Dias</th>
                    <th className="text-right p-4 font-medium">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjetos.map(projeto => {
                    const diasAteAcabar = getDiasAteAcabar(projeto.data_fim)
                    return (
                      <tr key={projeto.id} className="border-t hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-medium truncate max-w-[200px]">{projeto.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {projeto.tipo_cobranca?.toUpperCase() || 'TD'}
                              {projeto.pi && ` | PI: ${projeto.pi.identificador}`}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">{projeto.cliente?.nome || '-'}</td>
                        <td className="p-4 hidden lg:table-cell">{projeto.trader?.nome || '-'}</td>
                        <td className="p-4">{getStatusBadge(projeto.status)}</td>
                        <td className="p-4 text-right hidden sm:table-cell">{projeto.estrategias_count}</td>
                        <td className="p-4 text-right hidden md:table-cell">
                          {diasAteAcabar !== null ? (
                            <span className={diasAteAcabar <= 7 && diasAteAcabar >= 0 ? 'text-red-600 font-medium' : ''}>
                              {diasAteAcabar < 0 ? 'Encerrado' : `${diasAteAcabar}d`}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewingProjeto(projeto)}>
                                <Eye className="h-4 w-4 mr-2" />Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(projeto)}>
                                <Pencil className="h-4 w-4 mr-2" />Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteProjeto(projeto.id.toString())} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum projeto encontrado</h3>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
