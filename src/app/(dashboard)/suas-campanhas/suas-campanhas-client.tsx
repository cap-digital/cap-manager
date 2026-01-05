'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    TrendingUp,
    DollarSign,
    PieChart,
    ArrowUpRight,
    Activity,
    Layers,
    Calendar,
    AlertCircle
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

interface SuasCampanhasClientProps {
    projetos: any[]
    userId: number
    userName: string
}

export function SuasCampanhasClient({ projetos, userId, userName }: SuasCampanhasClientProps) {

    // 1. Extract and flatten only relevant strategies
    const allStrategies = useMemo(() => {
        const strategies: any[] = []

        projetos.forEach(projeto => {
            // Check ownership just in case, though API filtered it
            const isOwner = projeto.trader_id === userId || projeto.colaborador_id === userId
            if (!isOwner) return

            if (projeto.estrategias) {
                projeto.estrategias.forEach((est: any) => {
                    strategies.push({
                        ...est,
                        projeto_nome: projeto.nome,
                        cliente_nome: projeto.cliente?.nome,
                        projeto_id: projeto.id
                    })
                })
            }
        })

        return strategies
    }, [projetos, userId])

    // 2. Group by Strategy Type
    const groupedStrategies = useMemo(() => {
        const groups: Record<string, any[]> = {}

        allStrategies.forEach(est => {
            const type = est.estrategia || 'Outros'
            if (!groups[type]) groups[type] = []
            groups[type].push(est)
        })

        return groups
    }, [allStrategies])

    // 3. Calculate Totals
    const totals = useMemo(() => {
        return allStrategies.reduce((acc, curr) => ({
            budget: acc.budget + Number(curr.valor_bruto || 0),
            spend: acc.spend + Number(curr.gasto_ate_momento || 0),
        }), { budget: 0, spend: 0 })
    }, [allStrategies])

    const percentSpent = totals.budget > 0 ? (totals.spend / totals.budget) * 100 : 0

    return (
        <div className="space-y-8 fade-in">

            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Olá, {userName.split(' ')[0]}
                    </h2>
                    <p className="text-muted-foreground">
                        Aqui está o panorama geral das suas {allStrategies.length} estratégias ativas.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-4 py-1.5 h-auto text-sm gap-2 glass">
                        <Layers className="h-4 w-4" />
                        {Object.keys(groupedStrategies).length} Tipos de Estratégia
                    </Badge>
                </div>
            </div>

            {/* Stats Cards - Premium Look */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Orçamento Total"
                    value={formatCurrency(totals.budget)}
                    icon={DollarSign}
                    trend="+12% vs mês anterior"
                    color="text-emerald-500"
                    bgIcon="bg-emerald-500/10"
                />
                <StatsCard
                    title="Total Gasto"
                    value={formatCurrency(totals.spend)}
                    icon={Activity}
                    subValue={`${percentSpent.toFixed(1)}% do orçamento`}
                    color="text-amber-500"
                    bgIcon="bg-amber-500/10"
                />
                <StatsCard
                    title="Campanhas Ativas"
                    value={allStrategies.filter(s => s.status === 'ativa').length.toString()}
                    icon={TrendingUp}
                    trend={`${allStrategies.length} total`}
                    color="text-blue-500"
                    bgIcon="bg-blue-500/10"
                />
            </div>

            <Separator className="my-8" />

            {/* Grouped Strategies */}
            <div className="space-y-12">
                {Object.entries(groupedStrategies).map(([type, strategies]) => (
                    <div key={type} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1 bg-primary rounded-full" />
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                                {type}
                                <Badge variant="secondary" className="rounded-full px-2.5">
                                    {strategies.length}
                                </Badge>
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {strategies.map((est) => (
                                <PremiumStrategyCard key={est.id} strategy={est} />
                            ))}
                        </div>
                    </div>
                ))}

                {allStrategies.length === 0 && (
                    <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                        <Layers className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="text-xl font-medium text-muted-foreground">Nenhuma campanha encontrada</h3>
                        <p className="text-sm text-muted-foreground/60 max-w-sm mx-auto mt-2">
                            Parece que você ainda não tem estratégias vinculadas ao seu perfil.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ------ Sub Components ------

function StatsCard({ title, value, icon: Icon, trend, subValue, color, bgIcon }: any) {
    return (
        <Card className="border-none shadow-lg bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon className="h-24 w-24 -mr-4 -mt-4 rotate-12" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${bgIcon}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold tracking-tight">{value}</div>
                {trend && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                        {trend}
                    </p>
                )}
                {subValue && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {subValue}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

function PremiumStrategyCard({ strategy }: { strategy: any }) {
    const consumption = strategy.valor_bruto > 0
        ? ((strategy.gasto_ate_momento || 0) / strategy.valor_bruto) * 100
        : 0

    // Status colors
    const statusColor = {
        ativa: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800',
        pausada: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
        finalizada: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
        cancelada: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800',
        planejada: 'bg-gray-500/10 text-gray-600 border-gray-200 dark:border-gray-800',
    }[strategy.status as string] || 'bg-gray-100 text-gray-600'

    return (
        <Card className="border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <Badge variant="outline" className={`capitalize font-medium border ${statusColor}`}>
                            {strategy.status}
                        </Badge>
                        <h4 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                            {strategy.cliente_nome}
                        </h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {strategy.projeto_nome}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* KPI Highlight */}
                <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">KPI Principal</span>
                    <span className="font-mono font-bold text-primary">{strategy.kpi || 'N/A'}</span>
                </div>

                {/* Financials Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Orçamento</p>
                        <p className="font-medium">{formatCurrency(strategy.valor_bruto)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Gasto</p>
                        <p className="font-medium text-amber-600">{formatCurrency(strategy.gasto_ate_momento)}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Consumo</span>
                        <span className={`font-medium ${consumption > 90 ? 'text-red-500' : 'text-primary'}`}>
                            {consumption.toFixed(1)}%
                        </span>
                    </div>
                    <Progress value={consumption} className="h-1.5" />
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-2 border-t mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1" title="Data Início">
                        <Calendar className="h-3 w-3" />
                        {strategy.data_inicio ? formatDate(strategy.data_inicio) : '-'}
                    </div>
                    <div className="flex items-center gap-1" title="Plataforma">
                        <span className="capitalize">{strategy.plataforma}</span>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
