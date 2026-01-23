import { ScrollText } from 'lucide-react'

// ... existing imports ...

interface Props {
    initialProjetos: any[]
    initialContratos: any[]
}

export function DashboardGerencialClient({ initialProjetos, initialContratos }: Props) {
    const [search, setSearch] = useState('')

    // Processar dados
    const stats = useMemo(() => {
        let totalProjetos = 0
        let totalEstrategiasAtivas = 0
        let totalPlataformaFEE = 0 // Antigo "Valor FEE" (soma das estratégias de projetos FEE)
        let totalInvestidoTD = 0

        // Projetos
        const projetosFEE: Projeto[] = []
        const projetosTD: Projeto[] = []

        initialProjetos.forEach(p => {
            // Filtrar por busca (nome projeto ou cliente)
            const matchesSearch =
                search === '' ||
                p.nome.toLowerCase().includes(search.toLowerCase()) ||
                p.cliente?.nome.toLowerCase().includes(search.toLowerCase())

            if (!matchesSearch) return

            totalProjetos++

            const estrategiasAtivas = p.estrategias?.filter((e: any) => e.status === 'ativa') || []
            totalEstrategiasAtivas += estrategiasAtivas.length

            const valorTotalProjeto = p.estrategias?.reduce((acc: number, e: any) => acc + Number(e.valor_bruto || 0), 0) || 0

            if (p.tipo_cobranca === 'fee') {
                projetosFEE.push(p)
                totalPlataformaFEE += valorTotalProjeto
            } else {
                projetosTD.push(p)
                totalInvestidoTD += valorTotalProjeto
            }
        })

        // Contratos Stats
        const contratosAtivos = initialContratos.filter(c => c.ativo)
        const qtdContratos = contratosAtivos.length
        const valorContratosFEE = contratosAtivos
            .filter(c => c.recorrente)
            .reduce((acc: number, c: any) => acc + Number(c.valor || 0), 0)

        return {
            totalProjetos,
            totalEstrategiasAtivas,
            totalPlataformaFEE,
            totalInvestidoTD,
            projetosFEE,
            projetosTD,
            qtdContratos,
            valorContratosFEE
        }
    }, [initialProjetos, initialContratos, search])

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
                        <ScrollText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.qtdContratos}</div>
                        <p className="text-xs text-muted-foreground">Total de contratos ativos</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita FEE (Contratos)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.valorContratosFEE)}</div>
                        <p className="text-xs text-muted-foreground">Valor mensal contratos recorrentes</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Projetos</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProjetos}</div>
                        <p className="text-xs text-muted-foreground">Projetos filtrados</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estratégias Ativas</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalEstrategiasAtivas}</div>
                        <p className="text-xs text-muted-foreground">Em execução agora</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Investimento TD</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalInvestidoTD)}</div>
                        <p className="text-xs text-muted-foreground">Mídia veiculada (TD)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor Plataforma (FEE)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalPlataformaFEE)}</div>
                        <p className="text-xs text-muted-foreground">Veiculado via FEE</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Tabs */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 max-w-md">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por cliente ou projeto..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Tabs defaultValue="visao-geral" className="w-full">
                    <TabsList>
                        <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
                        <TabsTrigger value="td">Trading Desk (TD)</TabsTrigger>
                        <TabsTrigger value="fee">FEE</TabsTrigger>
                    </TabsList>

                    <TabsContent value="visao-geral" className="space-y-4 pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Todas as Estratégias (Resumo)</CardTitle>
                                <CardDescription>Visão consolidada de todas as estratégias cadastradas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ProjectsTable projects={[...stats.projetosTD, ...stats.projetosFEE]} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="td" className="space-y-4 pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Projetos Trading Desk</CardTitle>
                                <CardDescription>Detalhamento de projetos e estratégias TD.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ProjectsTable projects={stats.projetosTD} showMargins />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="fee" className="space-y-4 pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Projetos FEE</CardTitle>
                                <CardDescription>Detalhamento de projetos e estratégias FEE.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ProjectsTable projects={stats.projetosFEE} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

function ProjectsTable({ projects, showMargins = false }: { projects: Projeto[], showMargins?: boolean }) {
    if (projects.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">Nenhum projeto encontrado.</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cliente / Projeto</TableHead>
                        <TableHead>Estratégia / Plataforma</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor Bruto</TableHead>
                        <TableHead className="text-right">Gasto Atual</TableHead>
                        {showMargins && <TableHead className="text-right">Margem Est.</TableHead>}
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((projeto) => {
                        const estrategias = projeto.estrategias || []
                        if (estrategias.length === 0) {
                            return (
                                <TableRow key={projeto.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground">{projeto.cliente?.nome}</span>
                                            <span>{projeto.nome}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell colSpan={showMargins ? 5 : 4} className="text-center text-muted-foreground text-sm">
                                        Sem estratégias cadastradas
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={`/projetos/${projeto.id}`}>Ver</a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        }

                        return estrategias.map((est) => (
                            <TableRow key={`${projeto.id}-${est.id}`}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">{projeto.cliente?.nome}</span>
                                        <span>{projeto.nome}</span>
                                        <Badge variant="outline" className="w-fit mt-1 text-[10px]">{projeto.tipo_cobranca.toUpperCase()}</Badge>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-medium">{est.estrategia || 'N/A'}</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs">{est.plataforma}</Badge>
                                            {est.kpi && <span className="text-xs text-muted-foreground">KPI: {est.kpi}</span>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            est.status === 'ativa' ? 'default' :
                                                est.status === 'finalizada' ? 'secondary' :
                                                    est.status === 'pausada' ? 'secondary' : 'outline'
                                        }
                                        className={est.status === 'ativa' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    >
                                        {est.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(Number(est.valor_bruto))}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end">
                                        <span>{formatCurrency(Number(est.gasto_ate_momento || 0))}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {est.valor_bruto > 0
                                                ? `${((Number(est.gasto_ate_momento || 0) / est.valor_bruto) * 100).toFixed(1)}%`
                                                : '0%'}
                                        </span>
                                    </div>
                                </TableCell>
                                {showMargins && (
                                    <TableCell className="text-right">
                                        {/* Calculo de margem aqui se tiver dados */}
                                        -
                                    </TableCell>
                                )}
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                        <a href={`/projetos/${projeto.id}`}>
                                            <ArrowUpRight className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
