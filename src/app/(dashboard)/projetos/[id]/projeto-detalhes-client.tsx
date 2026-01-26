'use client'

import { useState, useMemo } from 'react'
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
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Activity,
  BarChart3,
} from 'lucide-react'
import { formatCurrency, formatDate, maskCurrency, parseCurrency } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { SearchableSelect } from '@/components/ui/searchable-select'

type TipoCobranca = 'td' | 'fee'
type StatusProjeto = 'rascunho' | 'ativo' | 'pausado' | 'finalizado' | 'cancelado'
type StatusEstrategia = 'planejada' | 'ativa' | 'pausada' | 'finalizada' | 'cancelada'
type Plataforma = 'meta' | 'google' | 'tiktok' | 'linkedin' | 'twitter' | 'pinterest' | 'spotify' | 'kwai' | 'tinder' | 'programatica' | 'outro'
type GrupoRevisao = 'A' | 'B' | 'C'

interface SimplifiedPi {
  id: number
  identificador: string
  valor_bruto: number
  cliente_id: number | null
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
  data_inicio: string | null
  valor_bruto: number
  porcentagem_agencia: number
  porcentagem_plataforma: number
  entrega_contratada: number | null
  gasto_ate_momento: number | null
  entregue_ate_momento: number | null
  data_atualizacao: string | null
  // Valores calculados
  valor_liquido: number | null
  valor_plataforma: number | null
  coeficiente: number | null
  valor_por_dia_plataforma: number | null
  valor_restante: number | null
  restante_por_dia: number | null
  percentual_entrega: number | null
  estimativa_resultado: number | null
  estimativa_sucesso: number | null
  meta_custo_resultado: number | null
  custo_resultado: number | null
  gasto_ate_momento_bruto: number | null
  valor_restante_bruto: number | null
  pode_abaixar_margem: boolean | null
  pode_aumentar_margem: boolean | null
  observacao: string | null
  plataforma_custom: string | null
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
  { value: 'kwai', label: 'Kwai' },
  { value: 'tinder', label: 'Tinder' },
  { value: 'programatica', label: 'Programática' },
  { value: 'outro', label: 'Outro' },
]

const estrategiaOptions = [
  'Tráfego',
  'Conversão',
  'Engajamento',
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
  'CPE',
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
  const [showPerformance, setShowPerformance] = useState(true)
  const [showEntregas, setShowEntregas] = useState(false)

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
    data_inicio: '',
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

  // Filtrar PIs baseado no cliente selecionado no formulário
  const filteredPis = useMemo(() => {
    if (!projetoForm.cliente_id) return []
    return pis.filter(pi => pi.cliente_id === projetoForm.cliente_id)
  }, [pis, projetoForm.cliente_id])

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
      data_inicio: '',
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
    // Restante = Valor Bruto - Gasto até o momento
    const valorRestante = e.gasto_ate_momento !== null ? e.valor_bruto - e.gasto_ate_momento : e.valor_bruto
    const custoResultado = e.entregue_ate_momento && e.gasto_ate_momento
      ? e.gasto_ate_momento / e.entregue_ate_momento
      : null

    return { valorLiquido, valorPlataforma, valorPorDia, percentualEntrega, valorRestante, custoResultado }
  }

  // Calcula valores completos para exibição no formulário de estratégia
  const calcularValoresFormulario = () => {
    const isFee = projeto.tipo_cobranca === 'fee'
    const valorBruto = parseFloat(estrategiaForm.valor_bruto) || 0
    const porcentagemAgencia = isFee ? 0 : (parseFloat(estrategiaForm.porcentagem_agencia) || 0)
    const porcentagemPlataforma = isFee ? 100 : (parseFloat(estrategiaForm.porcentagem_plataforma) || 0)
    const entregaContratada = parseFloat(estrategiaForm.entrega_contratada) || 0
    const gastoAteMomento = parseFloat(estrategiaForm.gasto_ate_momento) || 0
    const entregueAteMomento = parseFloat(estrategiaForm.entregue_ate_momento) || 0
    const kpi = estrategiaForm.kpi

    // Valor Líquido: TD = Bruto - (Bruto * %Agência), FEE = Bruto
    const valorLiquido = isFee ? valorBruto : valorBruto - (valorBruto * porcentagemAgencia / 100)

    // Valor Plataforma: TD = Líquido * %Plataforma, FEE = Bruto
    const valorPlataforma = isFee ? valorBruto : valorLiquido * (porcentagemPlataforma / 100)

    // Coeficiente: Valor Plataforma / Valor Bruto (TD apenas)
    const coeficiente = !isFee && valorBruto > 0 ? valorPlataforma / valorBruto : null

    // Dias da estratégia: data_fim projeto - data_inicio estratégia
    let diasEstrategia: number | null = null
    if (projeto.data_fim && estrategiaForm.data_inicio) {
      const fim = new Date(projeto.data_fim)
      const inicio = new Date(estrategiaForm.data_inicio)
      diasEstrategia = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
      if (diasEstrategia < 0) diasEstrategia = null
    }

    // Dias até acabar
    const diasAteAcabar = getDiasAteAcabar(projeto.data_fim)

    // Valor por Dia Plataforma
    const valorPorDiaPlataforma = diasEstrategia && diasEstrategia > 0 ? valorPlataforma / diasEstrategia : null

    // % Entrega Contratada
    const percentualEntrega = entregaContratada > 0 && entregueAteMomento > 0
      ? (entregueAteMomento / entregaContratada) * 100
      : null

    // Custo por Resultado: Gasto até o momento / Entregue até o momento
    const custoResultado = entregueAteMomento > 0 && gastoAteMomento > 0
      ? gastoAteMomento / entregueAteMomento
      : null

    // Estimativa de Resultado: Valor Plataforma / (Gasto até o momento / Entregue até o momento)
    const estimativaResultado = custoResultado && custoResultado > 0
      ? valorPlataforma / custoResultado
      : null

    // Estimativa de Sucesso: Estimativa de Resultado / Entrega Contratada
    const estimativaSucesso = estimativaResultado && entregaContratada > 0
      ? (estimativaResultado / entregaContratada) * 100
      : null

    // Valor Restante: Valor Plataforma - Gasto até o momento
    const valorRestante = valorPlataforma - gastoAteMomento

    // Restante por Dia: Valor Restante / Dias até acabar
    const restantePorDia = diasAteAcabar && diasAteAcabar > 0 ? valorRestante / diasAteAcabar : null

    // Meta Custo por Resultado: Valor Plataforma / (Entrega Contratada / (KPI=CPM ? 1000 : 1))
    const divisorKpi = kpi === 'CPM' ? 1000 : 1
    const metaCustoResultado = entregaContratada > 0
      ? valorPlataforma / (entregaContratada / divisorKpi)
      : null

    // Gasto até o momento Bruto: Gasto até o momento / (Valor Plataforma / Valor Bruto) = Gasto / Coeficiente
    const gastoAteMomentoBruto = coeficiente && coeficiente > 0
      ? gastoAteMomento / coeficiente
      : null

    // Valor Restante Bruto: Valor Bruto - Gasto até o momento Bruto
    const valorRestanteBruto = gastoAteMomentoBruto !== null
      ? valorBruto - gastoAteMomentoBruto
      : null

    // Pode abaixar a margem? TD apenas: Estimativa Sucesso > 150%
    const podeAbaixarMargem = !isFee && estimativaSucesso !== null
      ? estimativaSucesso > 150
      : null

    // Pode aumentar a margem? TD apenas: Estimativa Sucesso < 100%
    const podeAumentarMargem = !isFee && estimativaSucesso !== null
      ? estimativaSucesso < 100
      : null

    return {
      valorLiquido,
      valorPlataforma,
      coeficiente,
      diasEstrategia,
      diasAteAcabar,
      valorPorDiaPlataforma,
      percentualEntrega,
      custoResultado,
      estimativaResultado,
      estimativaSucesso,
      valorRestante,
      restantePorDia,
      metaCustoResultado,
      gastoAteMomentoBruto,
      valorRestanteBruto,
      podeAbaixarMargem,
      podeAumentarMargem,
      isFee,
    }
  }

  // Verifica se a estratégia precisa de atualização baseada no grupo de revisão
  const verificarAlertaAtualizacao = (estrategia: SimplifiedEstrategia) => {
    if (!estrategia.data_inicio) return null
    if (!projeto.grupo_revisao) return null

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const dataInicio = new Date(estrategia.data_inicio)
    const dataUltimaAtualizacao = estrategia.data_atualizacao ? new Date(estrategia.data_atualizacao) : null

    // Se não tem atualização, verificar desde o início
    const dataReferencia = dataUltimaAtualizacao || dataInicio

    // Calcular dias desde a última atualização
    const diffTime = hoje.getTime() - dataReferencia.getTime()
    const diasDesdeAtualizacao = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Definir limite baseado no grupo
    let diasLimite = 1 // Grupo A - todos os dias
    if (projeto.grupo_revisao === 'B') {
      diasLimite = 2 // Segunda, Quarta, Sexta (max 2 dias)
    } else if (projeto.grupo_revisao === 'C') {
      diasLimite = 3 // Terça, Quinta (max 3 dias)
    }

    if (diasDesdeAtualizacao > diasLimite) {
      return {
        diasAtraso: diasDesdeAtualizacao - diasLimite,
        diasDesdeAtualizacao,
        mensagem: dataUltimaAtualizacao
          ? `Última atualização há ${diasDesdeAtualizacao} dias`
          : `Sem atualização desde o início (${diasDesdeAtualizacao} dias)`
      }
    }

    return null
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

      // Atualizar estado local com dados da API
      setProjeto(prev => ({
        ...prev,
        cliente_id: updatedProjeto.clienteId,
        nome: updatedProjeto.nome,
        pi_id: updatedProjeto.piId,
        tipo_cobranca: updatedProjeto.tipoCobranca,
        agencia_id: updatedProjeto.agenciaId,
        trader_id: updatedProjeto.traderId,
        colaborador_id: updatedProjeto.colaboradorId,
        status: updatedProjeto.status,
        data_inicio: updatedProjeto.dataInicio ? updatedProjeto.dataInicio.split('T')[0] : null,
        data_fim: updatedProjeto.dataFim ? updatedProjeto.dataFim.split('T')[0] : null,
        link_proposta: updatedProjeto.linkProposta,
        url_destino: updatedProjeto.urlDestino,
        grupo_revisao: updatedProjeto.grupoRevisao,
        cliente: updatedProjeto.cliente,
        trader: updatedProjeto.trader,
        colaborador: updatedProjeto.colaborador,
        pi: updatedProjeto.pi ? {
          id: updatedProjeto.pi.id,
          identificador: updatedProjeto.pi.identificador,
          valor_bruto: Number(updatedProjeto.pi.valorBruto),
          cliente_id: updatedProjeto.pi.cliente_id || null,
        } : null,
        agencia: updatedProjeto.agencia,
        estrategias: prev.estrategias,
      }))

      toast({ title: 'Projeto atualizado!' })
      if (closeAfterSave) {
        setIsProjetoOpen(false)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro'
      toast({ variant: 'destructive', title: 'Erro', description: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitEstrategia = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação da data de início da estratégia
    if (estrategiaForm.data_inicio) {
      const dataInicioEstrategia = new Date(estrategiaForm.data_inicio)

      if (projeto.data_inicio) {
        const dataInicioProjeto = new Date(projeto.data_inicio)
        if (dataInicioEstrategia < dataInicioProjeto) {
          toast({
            variant: 'destructive',
            title: 'Data inválida',
            description: `A data de início da estratégia deve ser igual ou posterior à data de início do projeto (${formatDate(projeto.data_inicio)})`
          })
          return
        }
      }

      if (projeto.data_fim) {
        const dataFimProjeto = new Date(projeto.data_fim)
        if (dataInicioEstrategia > dataFimProjeto) {
          toast({
            variant: 'destructive',
            title: 'Data inválida',
            description: `A data de início da estratégia deve ser anterior à data de fim do projeto (${formatDate(projeto.data_fim)})`
          })
          return
        }
      }
    }

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
      data_inicio: estrategiaForm.data_inicio || null,
      valor_bruto: estrategiaForm.valor_bruto ? parseFloat(estrategiaForm.valor_bruto) : 0,
      porcentagem_agencia: estrategiaForm.porcentagem_agencia ? parseFloat(estrategiaForm.porcentagem_agencia) : 0,
      porcentagem_plataforma: estrategiaForm.porcentagem_plataforma ? parseFloat(estrategiaForm.porcentagem_plataforma) : 0,
      entrega_contratada: estrategiaForm.entrega_contratada ? parseFloat(estrategiaForm.entrega_contratada) : null,
      gasto_ate_momento: estrategiaForm.gasto_ate_momento ? (typeof estrategiaForm.gasto_ate_momento === 'string' ? parseFloat(estrategiaForm.gasto_ate_momento) : estrategiaForm.gasto_ate_momento) : null,
      entregue_ate_momento: estrategiaForm.entregue_ate_momento ? parseFloat(estrategiaForm.entregue_ate_momento) : null,
      data_atualizacao: estrategiaForm.data_atualizacao || null,
    }

    // Auto-update data_atualizacao if metrics changed
    if (editingEstrategia) {
      const metricsChanged =
        payload.gasto_ate_momento !== editingEstrategia.gasto_ate_momento ||
        payload.entregue_ate_momento !== editingEstrategia.entregue_ate_momento;

      if (metricsChanged && !payload.data_atualizacao) {
        payload.data_atualizacao = new Date().toISOString().split('T')[0];
      }
    } else if (payload.gasto_ate_momento || payload.entregue_ate_momento) {
      if (!payload.data_atualizacao) {
        payload.data_atualizacao = new Date().toISOString().split('T')[0];
      }
    }

    // Função para converter resposta da API para formato do estado local
    const formatEstrategiaFromApi = (apiData: Record<string, unknown>): SimplifiedEstrategia => ({
      id: apiData.id as number,
      projeto_id: apiData.projeto_id as number,
      plataforma: apiData.plataforma as Plataforma,
      nome_conta: apiData.nome_conta as string | null,
      id_conta: apiData.id_conta as string | null,
      campaign_id: apiData.campaign_id as string | null,
      estrategia: apiData.estrategia as string | null,
      kpi: apiData.kpi as string | null,
      status: apiData.status as StatusEstrategia,
      data_inicio: apiData.data_inicio ? String(apiData.data_inicio).split('T')[0] : null,
      valor_bruto: Number(apiData.valor_bruto) || 0,
      porcentagem_agencia: Number(apiData.porcentagem_agencia) || 0,
      porcentagem_plataforma: Number(apiData.porcentagem_plataforma) || 0,
      entrega_contratada: apiData.entrega_contratada ? Number(apiData.entrega_contratada) : null,
      gasto_ate_momento: apiData.gasto_ate_momento ? Number(apiData.gasto_ate_momento) : null,
      entregue_ate_momento: apiData.entregue_ate_momento ? Number(apiData.entregue_ate_momento) : null,
      data_atualizacao: apiData.data_atualizacao ? String(apiData.data_atualizacao).split('T')[0] : null,
      // Valores calculados
      valor_liquido: apiData.valor_liquido ? Number(apiData.valor_liquido) : null,
      valor_plataforma: apiData.valor_plataforma ? Number(apiData.valor_plataforma) : null,
      coeficiente: apiData.coeficiente ? Number(apiData.coeficiente) : null,
      valor_por_dia_plataforma: apiData.valor_por_dia_plataforma ? Number(apiData.valor_por_dia_plataforma) : null,
      valor_restante: apiData.valor_restante ? Number(apiData.valor_restante) : null,
      restante_por_dia: apiData.restante_por_dia ? Number(apiData.restante_por_dia) : null,
      percentual_entrega: apiData.percentual_entrega ? Number(apiData.percentual_entrega) : null,
      estimativa_resultado: apiData.estimativa_resultado ? Number(apiData.estimativa_resultado) : null,
      estimativa_sucesso: apiData.estimativa_sucesso ? Number(apiData.estimativa_sucesso) : null,
      meta_custo_resultado: apiData.meta_custo_resultado ? Number(apiData.meta_custo_resultado) : null,
      custo_resultado: apiData.custo_resultado ? Number(apiData.custo_resultado) : null,
      gasto_ate_momento_bruto: apiData.gasto_ate_momento_bruto ? Number(apiData.gasto_ate_momento_bruto) : null,
      valor_restante_bruto: apiData.valor_restante_bruto ? Number(apiData.valor_restante_bruto) : null,
      pode_abaixar_margem: apiData.pode_abaixar_margem as boolean | null,
      pode_aumentar_margem: apiData.pode_aumentar_margem as boolean | null,
      observacao: apiData.observacao as string | null || null,
      plataforma_custom: apiData.plataforma_custom as string | null || null,
      created_at: String(apiData.created_at),
      updated_at: String(apiData.updated_at),
    })

    try {
      if (editingEstrategia) {
        const response = await fetch(`/api/estrategias?id=${editingEstrategia.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error('Erro ao atualizar estrategia')
        const apiResponse = await response.json()
        const updatedEstrategia = formatEstrategiaFromApi(apiResponse)

        setProjeto(prev => ({
          ...prev,
          estrategias: prev.estrategias.map(est =>
            est.id === editingEstrategia.id ? updatedEstrategia : est
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
        const apiResponse = await response.json()
        const novaEstrategia = formatEstrategiaFromApi(apiResponse)

        setProjeto(prev => ({
          ...prev,
          estrategias: [...prev.estrategias, novaEstrategia]
        }))

        toast({ title: 'Estrategia adicionada!' })
      }

      setIsEstrategiaOpen(false)
      resetEstrategiaForm()
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
        <Card className={`h-full ${diasAteAcabar !== null && diasAteAcabar <= 7 && diasAteAcabar >= 0 ? 'bg-red-50 border-red-200' : diasAteAcabar !== null && diasAteAcabar < 0 ? 'bg-gray-50' : ''}`}>
          <CardContent className="p-4 h-full flex flex-col items-center justify-center">
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

      {/* Performance Panel - Collapsible */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="py-3 cursor-pointer" onClick={() => setShowPerformance(!showPerformance)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Chave de Performance</CardTitle>
            </div>
            <Button variant="ghost" size="sm">
              {showPerformance ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showPerformance && (
          <CardContent className="pt-0 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Gasto vs Orçamento */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> Gasto vs Orçamento
                  </span>
                  <span className="font-medium">
                    {totalLiquido > 0 ? Math.round((totalGasto / totalLiquido) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${totalLiquido > 0 && (totalGasto / totalLiquido) > 1
                      ? 'bg-red-500'
                      : totalLiquido > 0 && (totalGasto / totalLiquido) > 0.9
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                      }`}
                    style={{ width: `${Math.min((totalGasto / totalLiquido) * 100 || 0, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Gasto: {formatCurrency(totalGasto)}</span>
                  <span>Orçamento: {formatCurrency(totalLiquido)}</span>
                </div>
              </div>

              {/* Previsão de Entrega */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Target className="h-4 w-4" /> Previsão de Entrega
                  </span>
                  <span className="font-medium">
                    {(() => {
                      const totalEntregaContratada = projeto.estrategias.reduce((acc, e) => acc + (e.entrega_contratada || 0), 0)
                      const totalEntregue = projeto.estrategias.reduce((acc, e) => acc + (e.entregue_ate_momento || 0), 0)
                      return totalEntregaContratada > 0 ? Math.round((totalEntregue / totalEntregaContratada) * 100) : 0
                    })()}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  {(() => {
                    const totalEntregaContratada = projeto.estrategias.reduce((acc, e) => acc + (e.entrega_contratada || 0), 0)
                    const totalEntregue = projeto.estrategias.reduce((acc, e) => acc + (e.entregue_ate_momento || 0), 0)
                    const percent = totalEntregaContratada > 0 ? (totalEntregue / totalEntregaContratada) * 100 : 0
                    return (
                      <div
                        className={`h-3 rounded-full transition-all ${percent >= 100 ? 'bg-green-500' : percent >= 70 ? 'bg-blue-500' : percent >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    )
                  })()}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Entregue: {projeto.estrategias.reduce((acc, e) => acc + (e.entregue_ate_momento || 0), 0).toLocaleString('pt-BR')}</span>
                  <span>Meta: {projeto.estrategias.reduce((acc, e) => acc + (e.entrega_contratada || 0), 0).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              {/* Estimativa de Sucesso */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" /> Estimativa de Sucesso
                  </span>
                  {(() => {
                    const avgEstimativaSucesso = projeto.estrategias.length > 0
                      ? projeto.estrategias.reduce((acc, e) => acc + (e.estimativa_sucesso || 0), 0) / projeto.estrategias.filter(e => e.estimativa_sucesso).length || 0
                      : 0
                    return (
                      <span className={`font-bold ${avgEstimativaSucesso >= 100 ? 'text-green-600' : avgEstimativaSucesso >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {Math.round(avgEstimativaSucesso)}%
                      </span>
                    )
                  })()}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  {(() => {
                    const avgEstimativaSucesso = projeto.estrategias.length > 0
                      ? projeto.estrategias.reduce((acc, e) => acc + (e.estimativa_sucesso || 0), 0) / projeto.estrategias.filter(e => e.estimativa_sucesso).length || 0
                      : 0
                    return (
                      <div
                        className={`h-3 rounded-full transition-all ${avgEstimativaSucesso >= 100 ? 'bg-green-500' : avgEstimativaSucesso >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${Math.min(avgEstimativaSucesso, 150) / 1.5}%` }}
                      />
                    )
                  })()}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Valor Restante: {formatCurrency(totalRestante)}</span>
                  <span className={totalRestante < 0 ? 'text-red-600 font-medium' : ''}>
                    {totalRestante < 0 ? 'Estourado!' : 'Dentro do orçamento'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Plataforma</th>
                    <th className="text-left p-2 font-medium">Estratégia</th>
                    <th className="text-left p-2 font-medium">KPI</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-right p-2 font-medium">Valor</th>
                    <th className="text-right p-2 font-medium">Gasto</th>
                    <th className="text-right p-2 font-medium">Restante</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {projeto.estrategias.map(estrategia => {
                    const calc = calcularValoresEstrategia(estrategia)
                    const plataformaLabel = plataformaOptions.find(p => p.value === estrategia.plataforma)?.label?.split(' ')[0] || estrategia.plataforma
                    const alertaAtualizacao = verificarAlertaAtualizacao(estrategia)

                    return (
                      <tr key={estrategia.id} className={`border-t hover:bg-muted/30 ${alertaAtualizacao ? 'bg-red-50' : ''}`}>
                        <td className="p-2 capitalize">{plataformaLabel}</td>
                        <td className="p-2">{estrategia.estrategia || '-'}</td>
                        <td className="p-2">{estrategia.kpi || '-'}</td>
                        <td className="p-2">{getEstrategiaStatusBadge(estrategia.status)}</td>
                        <td className="p-2 text-right font-semibold text-green-600">{formatCurrency(estrategia.valor_bruto)}</td>
                        <td className="p-2 text-right text-amber-600">
                          {estrategia.gasto_ate_momento !== null ? formatCurrency(estrategia.gasto_ate_momento) : '-'}
                        </td>
                        <td className={`p-2 text-right font-semibold ${calc.valorRestante < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {formatCurrency(calc.valorRestante)}
                        </td>
                        <td className="p-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
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
                                  data_inicio: estrategia.data_inicio || '',
                                  valor_bruto: estrategia.valor_bruto.toString(),
                                  porcentagem_agencia: estrategia.porcentagem_agencia.toString(),
                                  porcentagem_plataforma: estrategia.porcentagem_plataforma.toString(),
                                  entrega_contratada: estrategia.entrega_contratada?.toString() || '',
                                  gasto_ate_momento: estrategia.gasto_ate_momento ? estrategia.gasto_ate_momento.toString() : '',
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
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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

      {/* ENTREGAS - Seção com Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            ENTREGAS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projeto.estrategias.length > 0 ? (
            <div className="flex gap-4">
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Plataforma</th>
                      <th className="text-left p-2 font-medium">Estratégia</th>
                      <th className="text-right p-2 font-medium">Entrega Contratada</th>
                      <th className="text-right p-2 font-medium">Entregue até o Momento</th>
                      <th className="text-right p-2 font-medium">% Entrega</th>
                      <th className="text-right p-2 font-medium">Custo/Resultado</th>
                      <th className="text-right p-2 font-medium">Meta Custo/Resultado</th>
                      <th className="text-right p-2 font-medium">Estimativa Resultado</th>
                      <th className="text-right p-2 font-medium">Estimativa Sucesso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projeto.estrategias
                      .filter(estrategia => {
                        if (!showEntregas) return true
                        // Filtro: mostrar apenas estratégias com dados de entrega
                        return estrategia.entrega_contratada !== null || estrategia.entregue_ate_momento !== null
                      })
                      .map(estrategia => {
                        const calc = calcularValoresEstrategia(estrategia)
                        const plataformaLabel = plataformaOptions.find(p => p.value === estrategia.plataforma)?.label?.split(' ')[0] || estrategia.plataforma
                        
                        // Usar valores calculados da estratégia quando disponíveis, senão calcular
                        const percentualEntrega = estrategia.percentual_entrega !== null && estrategia.percentual_entrega !== undefined
                          ? estrategia.percentual_entrega
                          : (estrategia.entrega_contratada && estrategia.entregue_ate_momento
                            ? (estrategia.entregue_ate_momento / estrategia.entrega_contratada) * 100
                            : null)
                        
                        const custoResultado = estrategia.custo_resultado !== null && estrategia.custo_resultado !== undefined
                          ? estrategia.custo_resultado
                          : (estrategia.entregue_ate_momento && estrategia.gasto_ate_momento && estrategia.entregue_ate_momento > 0
                            ? estrategia.gasto_ate_momento / estrategia.entregue_ate_momento
                            : null)

                        const valorPlataforma = estrategia.valor_plataforma !== null && estrategia.valor_plataforma !== undefined
                          ? estrategia.valor_plataforma
                          : calc.valorPlataforma

                        const metaCustoResultado = estrategia.meta_custo_resultado !== null && estrategia.meta_custo_resultado !== undefined
                          ? estrategia.meta_custo_resultado
                          : (estrategia.entrega_contratada && valorPlataforma && estrategia.kpi
                            ? (() => {
                                const divisorKpi = estrategia.kpi === 'CPM' ? 1000 : 1
                                return valorPlataforma / (estrategia.entrega_contratada / divisorKpi)
                              })()
                            : null)

                        const estimativaResultado = estrategia.estimativa_resultado !== null && estrategia.estimativa_resultado !== undefined
                          ? estrategia.estimativa_resultado
                          : (custoResultado && custoResultado > 0 && valorPlataforma
                            ? valorPlataforma / custoResultado
                            : null)

                        const estimativaSucesso = estrategia.estimativa_sucesso !== null && estrategia.estimativa_sucesso !== undefined
                          ? estrategia.estimativa_sucesso
                          : (estimativaResultado && estrategia.entrega_contratada && estrategia.entrega_contratada > 0
                            ? (estimativaResultado / estrategia.entrega_contratada) * 100
                            : null)

                        return (
                          <tr key={estrategia.id} className="border-t hover:bg-muted/30">
                            <td className="p-2 capitalize">{plataformaLabel}</td>
                            <td className="p-2">{estrategia.estrategia || '-'}</td>
                            <td className="p-2 text-right">
                              {estrategia.entrega_contratada !== null ? estrategia.entrega_contratada.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '-'}
                            </td>
                            <td className="p-2 text-right">
                              {estrategia.entregue_ate_momento !== null ? estrategia.entregue_ate_momento.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '-'}
                            </td>
                            <td className={`p-2 text-right font-medium ${percentualEntrega !== null && percentualEntrega >= 100 ? 'text-green-600' : percentualEntrega !== null && percentualEntrega >= 70 ? 'text-blue-600' : percentualEntrega !== null ? 'text-amber-600' : ''}`}>
                              {percentualEntrega !== null ? `${percentualEntrega.toFixed(1)}%` : '-'}
                            </td>
                            <td className="p-2 text-right">
                              {custoResultado !== null ? formatCurrency(custoResultado) : '-'}
                            </td>
                            <td className="p-2 text-right">
                              {metaCustoResultado !== null ? formatCurrency(metaCustoResultado) : '-'}
                            </td>
                            <td className="p-2 text-right">
                              {estimativaResultado !== null ? estimativaResultado.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '-'}
                            </td>
                            <td className={`p-2 text-right font-medium ${estimativaSucesso !== null && estimativaSucesso >= 100 ? 'text-green-600' : estimativaSucesso !== null && estimativaSucesso >= 80 ? 'text-yellow-600' : estimativaSucesso !== null ? 'text-red-600' : ''}`}>
                              {estimativaSucesso !== null ? `${estimativaSucesso.toFixed(1)}%` : '-'}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
              <div className="w-64 border-l pl-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Filtros</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showEntregas}
                        onCheckedChange={setShowEntregas}
                      />
                      <Label className="text-sm">Apenas com entregas</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Nenhuma estratégia cadastrada</h3>
              <p className="text-muted-foreground mt-1">Adicione estratégias para ver dados de entregas</p>
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
                  onValueChange={v => setProjetoForm(p => ({
                    ...p,
                    cliente_id: v ? parseInt(v) : p.cliente_id,
                    pi_id: null // Reset PI quando cliente muda
                  }))}
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
                      options={filteredPis.map(p => ({ value: p.id.toString(), label: p.identificador, description: formatCurrency(p.valor_bruto) }))}
                      value={projetoForm.pi_id?.toString() || ''}
                      onValueChange={v => setProjetoForm(p => ({ ...p, pi_id: v ? parseInt(v) : null }))}
                      placeholder={projetoForm.cliente_id ? "Selecione o PI" : "Selecione um cliente primeiro"}
                      disabled={!projetoForm.cliente_id}
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
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={estrategiaForm.data_inicio}
                  onChange={e => setEstrategiaForm(p => ({ ...p, data_inicio: e.target.value }))}
                  min={projeto.data_inicio || undefined}
                  max={projeto.data_fim || undefined}
                />
                {projeto.data_inicio && projeto.data_fim && (
                  <p className="text-xs text-muted-foreground">
                    Entre {formatDate(projeto.data_inicio)} e {formatDate(projeto.data_fim)}
                  </p>
                )}
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
                <Label>{projeto.tipo_cobranca === 'fee' ? 'Valor Plataforma (R$)' : 'Valor Bruto (R$)'}</Label>
                <Input type="number" step="0.01" value={estrategiaForm.valor_bruto} onChange={e => setEstrategiaForm(p => ({ ...p, valor_bruto: e.target.value }))} />
              </div>

              {projeto.tipo_cobranca === 'td' && !editingEstrategia && (
                <>
                  <div className="space-y-2">
                    <Label>% Agência</Label>
                    <Input type="number" step="0.01" max="100" placeholder="0" value={estrategiaForm.porcentagem_agencia} onChange={e => setEstrategiaForm(p => ({ ...p, porcentagem_agencia: e.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <Label>% Plataforma</Label>
                    <Input type="number" step="0.01" max="100" placeholder="0" value={estrategiaForm.porcentagem_plataforma} onChange={e => setEstrategiaForm(p => ({ ...p, porcentagem_plataforma: e.target.value }))} />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Entrega Contratada</Label>
                <Input type="number" step="0.01" value={estrategiaForm.entrega_contratada} onChange={e => setEstrategiaForm(p => ({ ...p, entrega_contratada: e.target.value }))} />
              </div>

              {/* Campos de Margem - Mostrar sempre em modo de edição para TD */}
              {projeto.tipo_cobranca === 'td' && editingEstrategia && (
                <div className="md:col-span-3 border-t pt-4 mt-2">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Margem (editar valores)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>% Agência</Label>
                      <Input
                        type="number"
                        step="0.01"
                        max="100"
                        placeholder="0"
                        value={estrategiaForm.porcentagem_agencia}
                        onChange={e => setEstrategiaForm(p => ({ ...p, porcentagem_agencia: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>% Plataforma</Label>
                      <Input
                        type="number"
                        step="0.01"
                        max="100"
                        placeholder="0"
                        value={estrategiaForm.porcentagem_plataforma}
                        onChange={e => setEstrategiaForm(p => ({ ...p, porcentagem_plataforma: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Campos de Acompanhamento */}
              <div className="md:col-span-3 border-t pt-4 mt-2">
                <p className="text-sm font-medium text-muted-foreground mb-3">Acompanhamento (atualizado pelo trader)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Gasto até o Momento (R$)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={estrategiaForm.gasto_ate_momento ? maskCurrency(estrategiaForm.gasto_ate_momento.toString().replace(/\D/g, '')) : ''}
                      onChange={e => {
                        const rawValue = e.target.value.replace(/\D/g, '')
                        if (!rawValue) {
                          setEstrategiaForm(p => ({ ...p, gasto_ate_momento: '' }))
                          return
                        }
                        // Converte para número (divide por 100 para considerar centavos)
                        const numericValue = parseInt(rawValue, 10) / 100
                        setEstrategiaForm(p => ({ ...p, gasto_ate_momento: numericValue.toString() }))
                      }}
                      className="border-amber-300 focus:border-amber-500"
                      placeholder="R$ 0,00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Entregue até o Momento</Label>
                    <Input
                      type="number"
                      step="1"
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

              {/* Seção de Valores Calculados */}
              {(() => {
                const calc = calcularValoresFormulario()
                const hasValues = parseFloat(estrategiaForm.valor_bruto) > 0

                if (!hasValues) return null

                return (
                  <div className="md:col-span-3 border-t pt-4 mt-2">
                    <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Valores Calculados
                    </p>

                    {/* Linha 1: Valores Básicos */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Valor Líquido</p>
                        <p className="font-semibold text-green-600">{formatCurrency(calc.valorLiquido)}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Valor Plataforma</p>
                        <p className="font-semibold">{formatCurrency(calc.valorPlataforma)}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Valor/Dia</p>
                        <p className="font-semibold">{calc.valorPorDiaPlataforma ? formatCurrency(calc.valorPorDiaPlataforma) : '-'}</p>
                      </div>
                      {!calc.isFee && calc.coeficiente && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Coeficiente</p>
                          <p className="font-semibold">{calc.coeficiente.toFixed(4)}</p>
                        </div>
                      )}
                    </div>

                    {/* Linha 2: Entrega e Estimativas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">% Entrega</p>
                        <p className="font-semibold">{calc.percentualEntrega ? `${calc.percentualEntrega.toFixed(1)}%` : '-'}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Estimativa Resultado</p>
                        <p className="font-semibold">{calc.estimativaResultado ? calc.estimativaResultado.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '-'}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Estimativa Sucesso</p>
                        <p className={`font-semibold ${calc.estimativaSucesso && calc.estimativaSucesso >= 100 ? 'text-green-600' : calc.estimativaSucesso ? 'text-red-600' : ''}`}>
                          {calc.estimativaSucesso ? `${calc.estimativaSucesso.toFixed(1)}%` : '-'}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Meta Custo/Resultado</p>
                        <p className="font-semibold">{calc.metaCustoResultado ? formatCurrency(calc.metaCustoResultado) : '-'}</p>
                      </div>
                    </div>

                    {/* Linha 3: Valores Restantes e Custos */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Valor Restante</p>
                        <p className={`font-semibold ${calc.valorRestante < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {formatCurrency(calc.valorRestante)}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Restante/Dia</p>
                        <p className="font-semibold">{calc.restantePorDia ? formatCurrency(calc.restantePorDia) : '-'}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Custo/Resultado</p>
                        <p className="font-semibold">{calc.custoResultado ? formatCurrency(calc.custoResultado) : '-'}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Dias Restantes</p>
                        <p className="font-semibold">{calc.diasAteAcabar !== null ? calc.diasAteAcabar : '-'}</p>
                      </div>
                    </div>

                    {/* Linha 4: Valores Brutos e Indicadores de Margem (TD apenas) */}
                    {!calc.isFee && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-xs text-muted-foreground">Gasto Bruto</p>
                          <p className="font-semibold text-amber-700">{calc.gastoAteMomentoBruto ? formatCurrency(calc.gastoAteMomentoBruto) : '-'}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-xs text-muted-foreground">Restante Bruto</p>
                          <p className="font-semibold text-amber-700">{calc.valorRestanteBruto ? formatCurrency(calc.valorRestanteBruto) : '-'}</p>
                        </div>
                        <div className={`p-3 rounded-lg border ${calc.podeAbaixarMargem ? 'bg-green-50 border-green-200' : calc.podeAumentarMargem ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-xs text-muted-foreground">Sugestão de Margem</p>
                          <p className={`font-semibold ${calc.podeAbaixarMargem ? 'text-green-600' : calc.podeAumentarMargem ? 'text-red-600' : 'text-gray-600'}`}>
                            {calc.podeAbaixarMargem ? 'Pode Abaixar' : calc.podeAumentarMargem ? 'Pode Aumentar' : 'Ideal'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
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
