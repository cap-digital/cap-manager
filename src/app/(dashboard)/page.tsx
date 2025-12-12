import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Building2,
  Megaphone,
  CheckSquare,
  TrendingUp,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Buscar estatísticas
  const [
    { count: clientesCount },
    { count: agenciasCount },
    { count: campanhasCount },
    { count: tarefasPendentesCount },
    { data: campanhasRecentes },
    { data: tarefasUrgentes },
  ] = await Promise.all([
    supabase.from('cap_manager_clientes').select('*', { count: 'exact', head: true }),
    supabase.from('cap_manager_agencias').select('*', { count: 'exact', head: true }),
    supabase.from('cap_manager_campanhas').select('*', { count: 'exact', head: true }),
    supabase.from('cap_manager_tarefas').select('*', { count: 'exact', head: true }).neq('status', 'done'),
    supabase
      .from('cap_manager_campanhas')
      .select('*, cliente:cap_manager_clientes(nome)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('cap_manager_tarefas')
      .select('*, cliente:cap_manager_clientes(nome), campanha:cap_manager_campanhas(nome)')
      .in('prioridade', ['alta', 'urgente'])
      .neq('status', 'done')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

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
      name: 'Campanhas',
      value: campanhasCount || 0,
      icon: Megaphone,
      href: '/campanhas',
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
  ]

  const statusColors: Record<string, string> = {
    rascunho: 'secondary',
    ativa: 'success',
    pausada: 'warning',
    finalizada: 'default',
    cancelada: 'destructive',
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
          {/* Campanhas Recentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Campanhas Recentes
                </CardTitle>
                <CardDescription>Últimas campanhas criadas</CardDescription>
              </div>
              <Link
                href="/campanhas"
                className="text-sm text-primary hover:underline"
              >
                Ver todas
              </Link>
            </CardHeader>
            <CardContent>
              {campanhasRecentes && campanhasRecentes.length > 0 ? (
                <div className="space-y-4">
                  {campanhasRecentes.map((campanha: {
                    id: string
                    nome: string
                    status: string
                    cliente: { nome: string } | null
                  }) => (
                    <div
                      key={campanha.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium">{campanha.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {campanha.cliente?.nome || 'Sem cliente'}
                        </p>
                      </div>
                      <Badge variant={statusColors[campanha.status] as 'default' | 'secondary' | 'destructive'}>
                        {campanha.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma campanha encontrada</p>
                  <Link
                    href="/campanhas"
                    className="text-primary hover:underline text-sm"
                  >
                    Criar primeira campanha
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
                  {tarefasUrgentes.map((tarefa: {
                    id: string
                    titulo: string
                    prioridade: string
                    data_vencimento: string | null
                    campanha: { nome: string } | null
                    cliente: { nome: string } | null
                  }) => (
                    <div
                      key={tarefa.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{tarefa.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {tarefa.campanha?.nome || tarefa.cliente?.nome || 'Sem vínculo'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {tarefa.data_vencimento && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}
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
