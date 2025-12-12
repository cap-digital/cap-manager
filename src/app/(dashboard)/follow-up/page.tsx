import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { FollowUpClient } from './follow-up-client'

export default async function FollowUpPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: currentUser } = await supabase
    .from('cap_manager_usuarios')
    .select('*')
    .eq('auth_id', user?.id)
    .single()

  const [{ data: campanhasData }, { data: followUpsData }, { data: tradersData }] = await Promise.all([
    supabase
      .from('cap_manager_campanhas')
      .select('id, nome, status, cliente:cap_manager_clientes(nome), trader:cap_manager_usuarios(id, nome)')
      .in('status', ['ativa', 'pausada'])
      .order('created_at', { ascending: false }),
    supabase
      .from('cap_manager_follow_ups')
      .select('*, campanha:cap_manager_campanhas(id, nome, cliente:cap_manager_clientes(nome)), trader:cap_manager_usuarios(id, nome)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('cap_manager_usuarios').select('id, nome').eq('ativo', true).order('nome'),
  ])

  // Transform data to match expected types
  const campanhas = (campanhasData || []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    nome: c.nome as string,
    status: c.status as string,
    cliente: Array.isArray(c.cliente) ? (c.cliente[0] as { nome: string } | null) : (c.cliente as { nome: string } | null),
    trader: Array.isArray(c.trader) ? (c.trader[0] as { id: string; nome: string } | null) : (c.trader as { id: string; nome: string } | null),
  }))

  const followUps = (followUpsData || []).map((f: Record<string, unknown>) => ({
    id: f.id as string,
    conteudo: f.conteudo as string,
    tipo: f.tipo as string,
    created_at: f.created_at as string,
    campanha: Array.isArray(f.campanha) ? (f.campanha[0] as { id: string; nome: string; cliente: { nome: string } | null } | null) : (f.campanha as { id: string; nome: string; cliente: { nome: string } | null } | null),
    trader: Array.isArray(f.trader) ? (f.trader[0] as { id: string; nome: string } | null) : (f.trader as { id: string; nome: string } | null),
  }))

  const traders = (tradersData || []) as { id: string; nome: string }[]

  return (
    <div>
      <Header
        title="Follow-up de Campanhas"
        subtitle="Acompanhe o progresso das campanhas por trader"
      />
      <div className="p-4 lg:p-8">
        <FollowUpClient
          campanhas={campanhas || []}
          followUps={followUps || []}
          traders={traders || []}
          currentUser={currentUser}
        />
      </div>
    </div>
  )
}
