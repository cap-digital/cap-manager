'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
    ChevronRight,
    Trash2,
    Calendar,
    AlertCircle,
    Plus,
    Pencil,
    X,
    CreditCard,
    Copy,
    Check,
    Info,
    RefreshCw
} from 'lucide-react'
import { formatCurrency, formatDateInput, maskCurrency, parseCurrency, maskNumber, parseNumber } from '@/lib/utils'
import {
    SimplifiedProjeto,
    SimplifiedEstrategia,
    SimplifiedPi,
    SimplifiedAgencia,
    TipoCobranca,
    StatusProjeto,
    StatusEstrategia,
    Plataforma,
    GrupoRevisao
} from './types'

// Options Constants
const tipoCobrancaOptions: { value: TipoCobranca; label: string }[] = [
    { value: 'td', label: 'TD (Trading Desk)' },
    { value: 'fee', label: 'FEE' },
]

const grupoRevisaoOptions: { value: GrupoRevisao; label: string; description: string }[] = [
    { value: 'A', label: 'Grupo A', description: 'Todos os dias' },
    { value: 'B', label: 'Grupo B', description: 'Segunda, Quarta e Sexta' },
    { value: 'C', label: 'Grupo C', description: 'Terça e Quinta' },
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

const kpiOptions = [
    'CPA',
    'CPC',
    'CPM',
    'CPL',
    'CPV',
    'CPE',
]

interface ProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    project: SimplifiedProjeto | null
    clientes: { id: number; nome: string; tipo_cobranca?: TipoCobranca }[]
    traders: { id: number; nome: string }[]
    pis: SimplifiedPi[]
    agencias: SimplifiedAgencia[]
    onSave: (project: SimplifiedProjeto) => void // Callback for optimistic updates
    onDelete?: (id: number) => void
}

export function ProjectDialog({
    open,
    onOpenChange,
    project,
    clientes,
    traders,
    pis,
    agencias,
    onSave,
    onDelete
}: ProjectDialogProps) {
    const [step, setStep] = useState<1 | 2>(1)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    // Project Form State
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
        grupo_revisao: null as GrupoRevisao | null,
    })

    // Strategy Form State
    const [isEstrategiaOpen, setIsEstrategiaOpen] = useState(false)
    const [editingEstrategia, setEditingEstrategia] = useState<SimplifiedEstrategia | null>(null)
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
        estimativa_resultado: '',
        estimativa_sucesso: '',
        gasto_ate_momento: '',
        entregue_ate_momento: '',
        data_atualizacao: '',
        observacao: '',
        plataforma_custom: '',
    })

    // Local state for strategies to manage optimistic updates for strategies within the dialog
    const [strategies, setStrategies] = useState<SimplifiedEstrategia[]>([])
    const [currentProjetoId, setCurrentProjetoId] = useState<number | null>(null)
    const [utmCopied, setUtmCopied] = useState(false)

    // Local state for PIs refresh
    const [pisList, setPisList] = useState(pis)
    const [isRefreshingPis, setIsRefreshingPis] = useState(false)

    // Sync props with state
    useEffect(() => {
        setPisList(pis)
    }, [pis])

    // Function to refresh PIs
    const refreshPis = async () => {
        setIsRefreshingPis(true)
        try {
            const res = await fetch('/api/pis')
            if (!res.ok) throw new Error('Falha ao buscar PIs')
            const data = await res.json()
            setPisList(data)
            toast({ title: 'Lista de PIs atualizada' })
        } catch (error) {
            console.error('Erro ao atualizar PIs:', error)
            toast({ title: 'Erro ao atualizar PIs', variant: 'destructive' })
        } finally {
            setIsRefreshingPis(false)
        }
    }

    // Filtrar PIs baseado no cliente selecionado
    const filteredPis = useMemo(() => {
        if (!formData.cliente_id) return []
        return pisList.filter(pi => pi.cliente_id === formData.cliente_id)
    }, [pisList, formData.cliente_id])

    // Auto-calculate Estimativa Sucesso (%) = (entregue_ate_momento / entrega_contratada) * 100
    useEffect(() => {
        const entregue = parseFloat(estrategiaForm.entregue_ate_momento) || 0
        const contratada = parseFloat(estrategiaForm.entrega_contratada) || 0

        if (contratada > 0 && entregue >= 0) {
            const sucesso = (entregue / contratada) * 100
            setEstrategiaForm(prev => ({
                ...prev,
                estimativa_sucesso: sucesso.toFixed(2)
            }))
        }
    }, [estrategiaForm.entregue_ate_momento, estrategiaForm.entrega_contratada])

    // Generate UTM parameters
    const gerarUTM = () => {
        const cliente = clientes.find(c => c.id === formData.cliente_id)
        const clienteNome = cliente?.nome || 'cliente'
        const plataforma = estrategiaForm.plataforma || 'plataforma'
        const estrategia = estrategiaForm.estrategia || 'estrategia'
        const campaignId = estrategiaForm.campaign_id || 'campaign'

        // Normalizar para URL (remover espaços, caracteres especiais, etc)
        const normalizar = (str: string) => str.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9]+/g, '_') // Substitui caracteres especiais por underscore
            .replace(/^_|_$/g, '') // Remove underscores do início e fim

        const utmSource = normalizar(plataforma)
        const utmMedium = normalizar(estrategia)
        const utmCampaign = normalizar(`${clienteNome}_${campaignId}`)

        const baseUrl = formData.url_destino || 'https://exemplo.com'
        const separator = baseUrl.includes('?') ? '&' : '?'

        return `${baseUrl}${separator}utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`
    }

    const copiarUTM = async () => {
        const utm = gerarUTM()
        try {
            await navigator.clipboard.writeText(utm)
            setUtmCopied(true)
            toast({ title: 'UTM copiada!', description: 'Link com parâmetros UTM copiado para área de transferência' })
            setTimeout(() => setUtmCopied(false), 2000)
        } catch (err) {
            toast({ variant: 'destructive', title: 'Erro ao copiar', description: 'Não foi possível copiar a UTM' })
        }
    }

    // Initialize form when project changes
    useEffect(() => {
        if (project) {
            setFormData({
                cliente_id: project.cliente_id,
                nome: project.nome,
                pi_id: project.pi_id,
                tipo_cobranca: project.tipo_cobranca || 'td',
                agencia_id: project.agencia_id,
                trader_id: project.trader_id,
                colaborador_id: project.colaborador_id,
                status: project.status,
                data_inicio: project.data_inicio || '',
                data_fim: project.data_fim || '',
                link_proposta: project.link_proposta || '',
                url_destino: project.url_destino || '',
                grupo_revisao: project.grupo_revisao || null,
            })
            setCurrentProjetoId(project.id)
            setStrategies(project.estrategias || [])
            setStep(1)
        } else {
            resetForm()
        }
    }, [project, open])

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
            grupo_revisao: null,
        })
        setCurrentProjetoId(null)
        setStrategies([])
        setStep(1)
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
            estimativa_resultado: '',
            estimativa_sucesso: '',
            gasto_ate_momento: '',
            entregue_ate_momento: '',
            data_atualizacao: '',
            observacao: '',
            plataforma_custom: '',
        })
        setEditingEstrategia(null)
    }

    // Calculated values
    const calcularDiasAteAcabar = useMemo(() => {
        if (!formData.data_fim) return null
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const fim = new Date(formData.data_fim)
        const diff = Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
        return diff
    }, [formData.data_fim])

    // Handlers
    const handleSubmitProjeto = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

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
            grupo_revisao: formData.grupo_revisao || null,
        }

        try {
            let savedProject: SimplifiedProjeto;

            if (currentProjetoId) {
                // UPDATE
                const response = await fetch(`/api/projetos?id=${currentProjetoId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const result = await response.json()
                if (!response.ok) throw new Error(result.error || 'Erro ao atualizar projeto')

                savedProject = {
                    ...result,
                    cliente: clientes.find(c => c.id === result.cliente_id) || null,
                    trader: traders.find(t => t.id === result.trader_id) || null,
                    estrategias: strategies // Keep current strategies
                }

                toast({ title: 'Projeto atualizado!' })
            } else {
                // CREATE
                const response = await fetch('/api/projetos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const result = await response.json()
                if (!response.ok) throw new Error(result.error || 'Erro ao criar projeto')

                savedProject = {
                    ...result,
                    cliente: clientes.find(c => c.id === result.cliente_id) || null,
                    trader: traders.find(t => t.id === result.trader_id) || null,
                    estrategias: []
                }

                setCurrentProjetoId(result.id)
                toast({ title: 'Projeto criado! Agora adicione as estrategias.' })
            }

            // Optimistic Update Callback
            onSave(savedProject)

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

        // Helper para limpar valores monetários (remove tudo que não é dígito)
        const parseMoney = (val: any) => {
            if (!val) return 0
            const str = val.toString().replace(/\D/g, '')
            return str ? parseInt(str, 10) / 100 : 0
        }

        const payload = {
            projeto_id: currentProjetoId,
            plataforma: estrategiaForm.plataforma,
            nome_conta: estrategiaForm.nome_conta || null,
            id_conta: estrategiaForm.id_conta || null,
            campaign_id: estrategiaForm.campaign_id || null,
            estrategia: estrategiaForm.estrategia || null,
            kpi: estrategiaForm.kpi || null,
            status: estrategiaForm.status,
            valor_bruto: parseMoney(estrategiaForm.valor_bruto),
            porcentagem_agencia: estrategiaForm.porcentagem_agencia ? parseFloat(estrategiaForm.porcentagem_agencia.toString().replace(',', '.')) : 0,
            porcentagem_plataforma: estrategiaForm.porcentagem_plataforma ? parseFloat(estrategiaForm.porcentagem_plataforma.toString().replace(',', '.')) : 0,
            entrega_contratada: estrategiaForm.entrega_contratada ? parseInt(estrategiaForm.entrega_contratada.replace(/\D/g, ''), 10) : null,
            estimativa_resultado: estrategiaForm.estimativa_resultado ? parseFloat(estrategiaForm.estimativa_resultado.toString().replace(',', '.')) : null,
            estimativa_sucesso: estrategiaForm.estimativa_sucesso ? parseFloat(estrategiaForm.estimativa_sucesso.toString().replace(',', '.')) : null,
            gasto_ate_momento: parseMoney(estrategiaForm.gasto_ate_momento),
            entregue_ate_momento: estrategiaForm.entregue_ate_momento ? parseFloat(estrategiaForm.entregue_ate_momento.toString().replace(',', '.')) : null,
            data_atualizacao: estrategiaForm.data_atualizacao || null,
            observacao: estrategiaForm.observacao || null,
            plataforma_custom: estrategiaForm.plataforma_custom || null,
        }

        try {
            if (editingEstrategia) {
                const response = await fetch(`/api/estrategias?id=${editingEstrategia.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                if (!response.ok) throw new Error('Erro ao atualizar estrategia')
                const updatedEstrategiaData = await response.json()

                // Update local strategies list
                const updatedStrategies = strategies.map(s =>
                    s.id === editingEstrategia.id ? { ...s, ...updatedEstrategiaData } : s
                )
                setStrategies(updatedStrategies)

                // Update parent via onSave to keep data in sync
                const currentProjectData = {
                    id: currentProjetoId,
                    cliente_id: formData.cliente_id!,
                    nome: formData.nome,
                    tipo_cobranca: formData.tipo_cobranca,
                    trader_id: formData.trader_id,
                    // ... other fields would be needed for a full object, but simplified:
                    // We can reconstruct mostly from formData and finding existing relations
                    cliente: clientes.find(c => c.id === formData.cliente_id) || null,
                    trader: traders.find(t => t.id === formData.trader_id) || null,
                    // ... fill other required fields for SimplifiedProjeto
                    pi: pis.find(p => p.id === formData.pi_id) || null,
                    pi_id: formData.pi_id,
                    agencia: agencias.find(a => a.id === formData.agencia_id) || null,
                    agencia_id: formData.agencia_id,
                    colaborador_id: formData.colaborador_id,
                    colaborador: null, // Assuming not critical for immediate view or passed
                    status: formData.status,
                    data_inicio: formData.data_inicio || null,
                    data_fim: formData.data_fim || null,
                    link_proposta: formData.link_proposta || null,
                    url_destino: formData.url_destino || null,
                    grupo_revisao: formData.grupo_revisao,
                    estrategias: updatedStrategies,
                    estrategias_count: updatedStrategies.length,
                    created_at: new Date().toISOString(), // Mock
                    updated_at: new Date().toISOString()
                } as SimplifiedProjeto

                onSave(currentProjectData)

                toast({ title: 'Estrategia atualizada!' })
            } else {
                const response = await fetch('/api/estrategias', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                if (!response.ok) {
                    const errorText = await response.text()
                    let errorMessage = 'Erro ao criar estrategia'
                    try {
                        const errorData = JSON.parse(errorText)
                        console.error('Erro detalhado (JSON):', errorData)
                        errorMessage = errorData.details || errorData.error || errorData.message || errorMessage
                    } catch (e) {
                        console.error('Erro detalhado (Texto):', errorText)
                        errorMessage = `Erro no servidor: ${errorText.slice(0, 100)}...`
                    }
                    throw new Error(errorMessage)
                }
                const novaEstrategia = await response.json()

                const updatedStrategies = [...strategies, novaEstrategia]
                setStrategies(updatedStrategies)

                // Sync parent
                const currentProjectData = {
                    id: currentProjetoId,
                    cliente_id: formData.cliente_id!,
                    nome: formData.nome,
                    tipo_cobranca: formData.tipo_cobranca,
                    trader_id: formData.trader_id,
                    cliente: clientes.find(c => c.id === formData.cliente_id) || null,
                    trader: traders.find(t => t.id === formData.trader_id) || null,
                    pi: pis.find(p => p.id === formData.pi_id) || null,
                    pi_id: formData.pi_id,
                    agencia: agencias.find(a => a.id === formData.agencia_id) || null,
                    agencia_id: formData.agencia_id,
                    colaborador_id: formData.colaborador_id,
                    colaborador: null,
                    status: formData.status,
                    data_inicio: formData.data_inicio || null,
                    data_fim: formData.data_fim || null,
                    link_proposta: formData.link_proposta || null,
                    url_destino: formData.url_destino || null,
                    grupo_revisao: formData.grupo_revisao,
                    estrategias: updatedStrategies,
                    estrategias_count: updatedStrategies.length,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                } as SimplifiedProjeto

                onSave(currentProjectData)

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

    const handleDeleteEstrategia = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta estrategia?')) return

        try {
            const response = await fetch(`/api/estrategias?id=${id}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Erro ao excluir estrategia')

            const updatedStrategies = strategies.filter(s => s.id !== id)
            setStrategies(updatedStrategies)

            // Sync parent
            if (currentProjetoId) {
                const currentProjectData = {
                    id: currentProjetoId,
                    cliente_id: formData.cliente_id!,
                    nome: formData.nome,
                    tipo_cobranca: formData.tipo_cobranca,
                    trader_id: formData.trader_id,
                    cliente: clientes.find(c => c.id === formData.cliente_id) || null,
                    trader: traders.find(t => t.id === formData.trader_id) || null,
                    pi: pis.find(p => p.id === formData.pi_id) || null,
                    pi_id: formData.pi_id,
                    agencia: agencias.find(a => a.id === formData.agencia_id) || null,
                    agencia_id: formData.agencia_id,
                    colaborador_id: formData.colaborador_id,
                    colaborador: null,
                    status: formData.status,
                    data_inicio: formData.data_inicio || null,
                    data_fim: formData.data_fim || null,
                    link_proposta: formData.link_proposta || null,
                    url_destino: formData.url_destino || null,
                    grupo_revisao: formData.grupo_revisao,
                    estrategias: updatedStrategies,
                    estrategias_count: updatedStrategies.length,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                } as SimplifiedProjeto
                onSave(currentProjectData)
            }

            toast({ title: 'Estrategia excluida!' })
            router.refresh()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro'
            toast({ variant: 'destructive', title: 'Erro', description: errorMessage })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                {/* Step Indicator */}
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => setStep(1)}
                        className={`flex items-center gap-2 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-primary text-white' : 'bg-muted'}`}>1</div>
                        <span className="font-medium">Dados do Projeto</span>
                    </button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <button
                        onClick={() => currentProjetoId && setStep(2)}
                        disabled={!currentProjetoId}
                        className={`flex items-center gap-2 ${step === 2 ? 'text-primary' : 'text-muted-foreground'} ${!currentProjetoId ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-primary text-white' : 'bg-muted'}`}>2</div>
                        <span className="font-medium">Estrategias</span>
                    </button>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSubmitProjeto}>
                        <DialogHeader>
                            <DialogTitle>{currentProjetoId ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
                            <DialogDescription>Preencha os dados basicos do projeto</DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome do Cliente *</Label>
                                <SearchableSelect
                                    options={clientes.map(c => ({ value: c.id.toString(), label: c.nome }))}
                                    value={formData.cliente_id?.toString() || ''}
                                    onValueChange={v => {
                                        const clienteId = v ? parseInt(v) : null
                                        const clienteSelecionado = clientes.find(c => c.id === clienteId)
                                        setFormData(p => ({
                                            ...p,
                                            cliente_id: clienteId,
                                            pi_id: null, // Reset PI quando cliente muda
                                            tipo_cobranca: clienteSelecionado?.tipo_cobranca || 'td'
                                        }))
                                    }}
                                    placeholder="Selecione um cliente"
                                    searchPlaceholder="Buscar cliente..."
                                    emptyMessage="Nenhum cliente encontrado."
                                />
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
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <SearchableSelect
                                                options={filteredPis.map(pi => ({
                                                    value: pi.id.toString(),
                                                    label: pi.identificador,
                                                    description: formatCurrency(pi.valor_bruto)
                                                }))}
                                                value={formData.pi_id?.toString() || ''}
                                                onValueChange={v => setFormData(p => ({ ...p, pi_id: v ? parseInt(v) : null }))}
                                                placeholder={formData.cliente_id ? "Selecione um PI" : "Selecione um cliente primeiro"}
                                                searchPlaceholder="Buscar PI..."
                                                emptyMessage={formData.cliente_id ? "Nenhum PI encontrado para este cliente." : "Selecione um cliente primeiro."}
                                                disabled={!formData.cliente_id}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={refreshPis}
                                            disabled={isRefreshingPis || !formData.cliente_id}
                                            title="Atualizar lista de PIs"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${isRefreshingPis ? 'animate-spin' : ''}`} />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 md:col-span-2">
                                <Label>Nome do Projeto *</Label>
                                <Input
                                    value={formData.nome}
                                    onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))}
                                    placeholder="Ex: Campanha Black Friday 2024"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v as StatusProjeto }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rascunho">Rascunho</SelectItem>
                                        <SelectItem value="ativo">Ativo</SelectItem>
                                        <SelectItem value="pausado">Pausado</SelectItem>
                                        <SelectItem value="finalizado">Finalizado</SelectItem>
                                        <SelectItem value="cancelado">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Data Inicio</Label>
                                <Input
                                    type="date"
                                    value={formData.data_inicio}
                                    onChange={e => setFormData(p => ({ ...p, data_inicio: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Data Fim</Label>
                                <div className="space-y-1">
                                    <Input
                                        type="date"
                                        value={formData.data_fim}
                                        onChange={e => setFormData(p => ({ ...p, data_fim: e.target.value }))}
                                    />
                                    {calcularDiasAteAcabar !== null && (
                                        <p className={`text-xs ${calcularDiasAteAcabar < 7 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                            {calcularDiasAteAcabar < 0
                                                ? `Expirou ha ${Math.abs(calcularDiasAteAcabar)} dias`
                                                : `Faltam ${calcularDiasAteAcabar} dias`
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>

                            {formData.tipo_cobranca === 'td' && (
                                <div className="space-y-2">
                                    <Label>Agencia Responsavel</Label>
                                    <SearchableSelect
                                        options={agencias.map(a => ({ value: a.id.toString(), label: a.nome }))}
                                        value={formData.agencia_id?.toString() || ''}
                                        onValueChange={v => setFormData(p => ({ ...p, agencia_id: v ? parseInt(v) : null }))}
                                        placeholder="Selecione uma agencia"
                                        searchPlaceholder="Buscar agencia..."
                                        emptyMessage="Nenhuma agencia encontrada."
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Trader Responsavel</Label>
                                <SearchableSelect
                                    options={traders.map(t => ({ value: t.id.toString(), label: t.nome }))}
                                    value={formData.trader_id?.toString() || ''}
                                    onValueChange={v => setFormData(p => ({ ...p, trader_id: v ? parseInt(v) : null }))}
                                    placeholder="Selecione um trader"
                                    searchPlaceholder="Buscar trader..."
                                    emptyMessage="Nenhum trader encontrado."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Grupo de Revisao</Label>
                                <Select value={formData.grupo_revisao || ''} onValueChange={v => setFormData(p => ({ ...p, grupo_revisao: v as GrupoRevisao }))}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {grupoRevisaoOptions.map(g => (
                                            <SelectItem key={g.value} value={g.value}>
                                                <div className="flex flex-col items-start">
                                                    <span>{g.label}</span>
                                                    <span className="text-xs text-muted-foreground">{g.description}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 md:col-span-3">
                                <Label>URL de Destino</Label>
                                <Input
                                    value={formData.url_destino}
                                    onChange={e => setFormData(p => ({ ...p, url_destino: e.target.value }))}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="space-y-2 md:col-span-3">
                                <Label>Link da Proposta / Drive</Label>
                                <Input
                                    value={formData.link_proposta}
                                    onChange={e => setFormData(p => ({ ...p, link_proposta: e.target.value }))}
                                    placeholder="https://..."
                                />
                            </div>

                        </div>

                        <DialogFooter className="flex justify-between items-center w-full">
                            {currentProjetoId && onDelete ? (
                                <Button type="button" variant="destructive" onClick={() => onDelete(currentProjetoId)}>
                                    Excluir Projeto
                                </Button>
                            ) : <div />}

                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Salvando...' : (currentProjetoId ? 'Salvar Alterações' : 'Criar e Ir para Estrategias')}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <DialogHeader>
                            <DialogTitle>Estrategias de Midia</DialogTitle>
                            <DialogDescription>
                                Gerencie as plataformas e orcamentos do projeto "{formData.nome}"
                            </DialogDescription>
                        </DialogHeader>

                        {/* List of Strategies */}
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {strategies.map(estrategia => (
                                <div key={estrategia.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium capitalize">
                                                {estrategia.plataforma === 'outro' && estrategia.plataforma_custom
                                                    ? estrategia.plataforma_custom
                                                    : estrategia.plataforma}
                                            </span>
                                            <Badge variant="outline" className={`text-xs ${estrategia.status === 'ativa' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : ''}`}>
                                                {estrategia.status}
                                            </Badge>
                                            {estrategia.kpi && <Badge variant="secondary" className="text-[10px]">{estrategia.kpi}</Badge>}
                                            {estrategia.observacao && (
                                                <span
                                                    className="cursor-help text-blue-500 hover:text-blue-600"
                                                    title={estrategia.observacao}
                                                >
                                                    <Info className="h-4 w-4" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex gap-3">
                                            <span>Invest: {formatCurrency(estrategia.valor_bruto)}</span>
                                            {estrategia.campaign_id && <span className="text-xs font-mono bg-muted px-1 rounded">{estrategia.campaign_id}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {/* Duplicate Button */}
                                        <Button variant="ghost" size="icon" title="Duplicar" onClick={() => {
                                            setEditingEstrategia(null)
                                            setEstrategiaForm({
                                                plataforma: estrategia.plataforma,
                                                nome_conta: estrategia.nome_conta || '',
                                                id_conta: '',
                                                campaign_id: '',
                                                estrategia: estrategia.estrategia || '',
                                                kpi: estrategia.kpi || '',
                                                status: 'planejada',
                                                valor_bruto: Math.round(estrategia.valor_bruto * 100).toString(),
                                                porcentagem_agencia: estrategia.porcentagem_agencia.toString(),
                                                porcentagem_plataforma: estrategia.porcentagem_plataforma.toString(),
                                                entrega_contratada: estrategia.entrega_contratada?.toString() || '',
                                                estimativa_resultado: '',
                                                estimativa_sucesso: '',
                                                gasto_ate_momento: '',
                                                entregue_ate_momento: '',
                                                data_atualizacao: '',
                                                observacao: estrategia.observacao ? estrategia.observacao + ' (Cópia)' : '',
                                                plataforma_custom: estrategia.plataforma_custom || '',
                                            })
                                            setIsEstrategiaOpen(true)
                                        }}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        {/* Edit Button */}
                                        <Button variant="ghost" size="icon" title="Editar" onClick={() => {
                                            setEditingEstrategia(estrategia)
                                            setEstrategiaForm({
                                                plataforma: estrategia.plataforma,
                                                nome_conta: estrategia.nome_conta || '',
                                                id_conta: estrategia.id_conta || '',
                                                campaign_id: estrategia.campaign_id || '',
                                                estrategia: estrategia.estrategia || '',
                                                kpi: estrategia.kpi || '',
                                                status: estrategia.status,
                                                valor_bruto: Math.round(estrategia.valor_bruto * 100).toString(),
                                                porcentagem_agencia: estrategia.porcentagem_agencia.toString(),
                                                porcentagem_plataforma: estrategia.porcentagem_plataforma.toString(),
                                                entrega_contratada: estrategia.entrega_contratada?.toString() || '',
                                                estimativa_resultado: estrategia.estimativa_resultado?.toString() || '',
                                                estimativa_sucesso: estrategia.estimativa_sucesso?.toString() || '',
                                                gasto_ate_momento: estrategia.gasto_ate_momento?.toString() || '',
                                                entregue_ate_momento: estrategia.entregue_ate_momento?.toString() || '',
                                                data_atualizacao: estrategia.data_atualizacao || '',
                                                observacao: estrategia.observacao || '',
                                                plataforma_custom: estrategia.plataforma_custom || '',
                                            })
                                            setIsEstrategiaOpen(true)
                                        }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        {/* Delete Button */}
                                        <Button variant="ghost" size="icon" className="text-destructive" title="Excluir" onClick={() => handleDeleteEstrategia(estrategia.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {strategies.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Nenhuma estrategia criada ainda.</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center">
                            <Button onClick={() => {
                                resetEstrategiaForm()
                                setIsEstrategiaOpen(true)
                            }} variant="outline" className="w-full border-dashed">
                                <Plus className="h-4 w-4 mr-2" /> Adicionar Estrategia
                            </Button>
                        </div>


                        {/* Strategy Form Dialog (Nested or Conditional Render) */}
                        {isEstrategiaOpen && (
                            <div className="border-t pt-6 mt-6 animate-in slide-in-from-bottom-2">
                                <h3 className="font-medium mb-4">{editingEstrategia ? 'Editar Estrategia' : 'Nova Estrategia'}</h3>
                                <form onSubmit={handleSubmitEstrategia} className="space-y-4 bg-muted/30 p-4 rounded-lg">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Plataforma *</Label>
                                            <Select value={estrategiaForm.plataforma} onValueChange={v => setEstrategiaForm(p => ({ ...p, plataforma: v as Plataforma, plataforma_custom: v !== 'outro' ? '' : p.plataforma_custom }))}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {plataformaOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            {estrategiaForm.plataforma === 'outro' && (
                                                <Input
                                                    className="mt-2"
                                                    value={estrategiaForm.plataforma_custom}
                                                    onChange={e => setEstrategiaForm(p => ({ ...p, plataforma_custom: e.target.value }))}
                                                    placeholder="Nome da plataforma"
                                                />
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select value={estrategiaForm.status} onValueChange={v => setEstrategiaForm(p => ({ ...p, status: v as StatusEstrategia }))}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="planejada">Planejada</SelectItem>
                                                    <SelectItem value="ativa">Ativa</SelectItem>
                                                    <SelectItem value="pausada">Pausada</SelectItem>
                                                    <SelectItem value="finalizada">Finalizada</SelectItem>
                                                    <SelectItem value="cancelada">Cancelada</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Observation Field */}
                                    <div className="space-y-2">
                                        <Label>Observação <span className="text-muted-foreground text-xs">(posicionamento específico, etc)</span></Label>
                                        <Textarea
                                            value={estrategiaForm.observacao}
                                            onChange={e => setEstrategiaForm(p => ({ ...p, observacao: e.target.value }))}
                                            placeholder="Ex: Segmento 25-34, público lookalike de compradores..."
                                            className="min-h-[60px]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Objetivo / Estrategia</Label>
                                            <Select value={estrategiaForm.estrategia} onValueChange={v => setEstrategiaForm(p => ({ ...p, estrategia: v }))}>
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>
                                                    {estrategiaOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>KPI Principal</Label>
                                            <Select value={estrategiaForm.kpi} onValueChange={v => setEstrategiaForm(p => ({ ...p, kpi: v }))}>
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>
                                                    {kpiOptions.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Entrega Contratada</Label>
                                            <Input
                                                type="text"
                                                value={estrategiaForm.entrega_contratada ? maskNumber(estrategiaForm.entrega_contratada) : ''}
                                                onChange={e => {
                                                    const rawValue = e.target.value.replace(/\D/g, '')
                                                    setEstrategiaForm(p => ({ ...p, entrega_contratada: rawValue }))
                                                }}
                                                placeholder="Ex: 10.000"
                                            />
                                        </div>
                                    </div>

                                    <div className={`grid ${formData.tipo_cobranca === 'fee' ? 'grid-cols-1' : 'grid-cols-3'} gap-4`}>
                                        <div className="space-y-2">
                                            <Label>Valor Bruto (R$) *</Label>
                                            <Input
                                                type="text"
                                                value={estrategiaForm.valor_bruto ? maskCurrency(estrategiaForm.valor_bruto) : ''}
                                                onChange={e => {
                                                    const rawValue = e.target.value.replace(/\D/g, '')
                                                    setEstrategiaForm(p => ({ ...p, valor_bruto: rawValue }))
                                                }}
                                                placeholder="R$ 0,00"
                                            />
                                        </div>
                                        {formData.tipo_cobranca !== 'fee' && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label>% Agencia</Label>
                                                    <Input type="number" step="0.1" value={estrategiaForm.porcentagem_agencia} onChange={e => setEstrategiaForm(p => ({ ...p, porcentagem_agencia: e.target.value }))} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>% Plataforma (Imposto)</Label>
                                                    <Input type="number" step="0.1" value={estrategiaForm.porcentagem_plataforma} onChange={e => setEstrategiaForm(p => ({ ...p, porcentagem_plataforma: e.target.value }))} />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Optional ID fields */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>ID Conta</Label>
                                            <Input value={estrategiaForm.id_conta} onChange={e => setEstrategiaForm(p => ({ ...p, id_conta: e.target.value }))} placeholder="ID da Conta de Anuncio" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nome Conta</Label>
                                            <Input value={estrategiaForm.nome_conta} onChange={e => setEstrategiaForm(p => ({ ...p, nome_conta: e.target.value }))} placeholder="Nome da Conta" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ID Campanha</Label>
                                            <Input value={estrategiaForm.campaign_id} onChange={e => setEstrategiaForm(p => ({ ...p, campaign_id: e.target.value }))} placeholder="ID Original da Campanha" />
                                        </div>
                                    </div>

                                    {/* UTM Generator */}
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            Link com UTM
                                            <Badge variant="outline" className="text-xs">Gerado Automaticamente</Badge>
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={gerarUTM()}
                                                readOnly
                                                className="bg-muted font-mono text-xs"
                                                placeholder="Preencha os campos acima para gerar a UTM"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={copiarUTM}
                                                title="Copiar UTM"
                                            >
                                                {utmCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Delivery and Estimation Fields */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Gasto até Momento (R$)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={estrategiaForm.gasto_ate_momento}
                                                onChange={e => setEstrategiaForm(p => ({ ...p, gasto_ate_momento: e.target.value }))}
                                                placeholder="R$ 0,00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Entregue até Momento</Label>
                                            <Input
                                                type="number"
                                                step="1"
                                                value={estrategiaForm.entregue_ate_momento}
                                                onChange={e => setEstrategiaForm(p => ({ ...p, entregue_ate_momento: e.target.value }))}
                                                placeholder="Ex: 5000"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Data Atualização</Label>
                                            <Input
                                                type="date"
                                                value={estrategiaForm.data_atualizacao}
                                                onChange={e => setEstrategiaForm(p => ({ ...p, data_atualizacao: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    {/* Campos de estimativa - Apenas exibidos quando editando (valores já existem no banco) */}
                                    {editingEstrategia && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    Estimativa Resultado
                                                    <Badge variant="secondary" className="text-xs">Auto</Badge>
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step="1"
                                                    value={estrategiaForm.estimativa_resultado}
                                                    readOnly
                                                    className="bg-muted"
                                                    placeholder="Calculado automaticamente"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    Estimativa Sucesso (%)
                                                    <Badge variant="secondary" className="text-xs">Auto</Badge>
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={estrategiaForm.estimativa_sucesso}
                                                    readOnly
                                                    className="bg-muted"
                                                    placeholder="Calculado automaticamente"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button type="button" variant="outline" onClick={() => setIsEstrategiaOpen(false)}>Cancelar</Button>
                                        <Button type="submit" disabled={isLoading}>{editingEstrategia ? 'Salvar Alterações' : 'Adicionar'}</Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <DialogFooter className="mt-8">
                            <Button type="button" variant="secondary" onClick={() => setStep(1)} className="mr-auto">
                                Voltar para Dados
                            </Button>
                            <Button type="button" onClick={() => onOpenChange(false)}>
                                Concluir
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
