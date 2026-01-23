import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Building2,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  AlertCircle,
  Calendar,
  ScrollText,
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  // Buscar estatísticas
  const [
    clientesResult,
    agenciasResult,
    projetosResult,
    tarefasPendentesResult,
    projetosRecentesResult,
    tarefasUrgentesResult,
    contratosResult,
  ] = await Promise.all([
    supabaseAdmin.from(TABLES.clientes).select('id', { count: 'exact', head: true }),
    supabaseAdmin.from(TABLES.agencias).select('id', { count: 'exact', head: true }),
    supabaseAdmin.from(TABLES.projetos).select('id', { count: 'exact', head: true }),
    supabaseAdmin.from(TABLES.tarefas).select('id', { count: 'exact', head: true }).neq('status', 'done'),
    supabaseAdmin
      .from(TABLES.projetos)
      .select(`*, cliente:${TABLES.clientes}(nome)`)
      .order('created_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from(TABLES.tarefas)
      .select(`*, cliente:${TABLES.clientes}(nome), projeto:${TABLES.projetos}(nome)`)
      .in('prioridade', ['alta', 'urgente'])
      .neq('status', 'done')
      .order('created_at', { ascending: false })
      .limit(5),
    supabaseAdmin.from(TABLES.contratos).select('id', { count: 'exact', head: true }),
  ])

  const clientesCount = clientesResult.count || 0
  const agenciasCount = agenciasResult.count || 0
  const projetosCount = projetosResult.count || 0
  const tarefasPendentesCount = tarefasPendentesResult.count || 0
  const projetosRecentes = projetosRecentesResult.data || []
  const tarefasUrgentes = tarefasUrgentesResult.data || []
  const contratosCount = contratosResult.count || 0

  const stats = [
    {
      name: 'Clientes',
      value: clientesCount || 0,
      icon: Users,
      href: '/clientes',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Agências',
      value: agenciasCount || 0,
      icon: Building2,
      href: '/agencias',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Projetos',
      value: projetosCount || 0,
      icon: FolderKanban,
      href: '/projetos',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Tarefas Pendentes',
      value: tarefasPendentesCount || 0,
      icon: CheckSquare,
      href: '/tarefas',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      name: 'Contratos',
      value: contratosCount || 0,
      icon: ScrollText,
      href: '/contratos',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ]

  const statusColors: Record<string, string> = {
    rascunho: 'secondary',
    ativo: 'success',
    pausado: 'warning',
    finalizado: 'default',
    cancelado: 'destructive',
  }

  const prioridadeColors: Record<string, string> = {
    baixa: 'secondary',
    media: 'default',
    alta: 'warning',
    urgente: 'destructive',
  }

  return (
    <div>
      <Header title="Dashboard" subtitle="Visão geral do sistema" />

      <div className="p-4 lg:p-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => (
            <Link key={stat.name} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.name}
                      </p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Projetos Recentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Projetos Recentes
                </CardTitle>
                <CardDescription>Últimos projetos criados</CardDescription>
              </div>
              <Link
                href="/projetos"
                className="text-sm text-primary hover:underline"
              >
                Ver todos
              </Link>
            </CardHeader>
            <CardContent>
              {projetosRecentes && projetosRecentes.length > 0 ? (
                <div className="space-y-4">
                  {projetosRecentes.map((projeto) => (
                    <Link key={projeto.id} href={`/projetos/${projeto.id}`}>
                      <div
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-medium">{projeto.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {projeto.cliente?.nome || 'Sem cliente'}
                          </p>
                        </div>
                        <Badge variant={statusColors[projeto.status] as 'default' | 'secondary' | 'destructive'}>
                          {projeto.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum projeto encontrado</p>
                  <Link
                    href="/projetos"
                    className="text-primary hover:underline text-sm"
                  >
                    Criar primeiro projeto
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tarefas Urgentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Tarefas Prioritárias
                </CardTitle>
                <CardDescription>Tarefas com alta prioridade</CardDescription>
              </div>
              <Link
                href="/tarefas"
                className="text-sm text-primary hover:underline"
              >
                Ver todas
              </Link>
            </CardHeader>
            <CardContent>
              {tarefasUrgentes && tarefasUrgentes.length > 0 ? (
                <div className="space-y-4">
                  {tarefasUrgentes.map((tarefa) => (
                    <div
                      key={tarefa.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{tarefa.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {tarefa.projeto?.nome || tarefa.cliente?.nome || 'Sem vínculo'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {tarefa.dataVencimento && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(tarefa.dataVencimento).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        <Badge variant={prioridadeColors[tarefa.prioridade] as 'default' | 'secondary' | 'destructive'}>
                          {tarefa.prioridade}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma tarefa urgente</p>
                  <Link
                    href="/tarefas"
                    className="text-primary hover:underline text-sm"
                  >
                    Ver todas as tarefas
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
