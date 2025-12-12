import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { CampanhasClient } from './campanhas-client'

export default async function CampanhasPage() {
  const supabase = await createClient()

  const [{ data: campanhas }, { data: clientes }, { data: usuarios }] =
    await Promise.all([
      supabase
        .from('cap_manager_campanhas')
        .select('*, cliente:cap_manager_clientes(id, nome), trader:cap_manager_usuarios(id, nome)')
        .order('created_at', { ascending: false }),
      supabase.from('cap_manager_clientes').select('id, nome').eq('ativo', true).order('nome'),
      supabase.from('cap_manager_usuarios').select('id, nome').eq('ativo', true).order('nome'),
    ])

  return (
    <div>
      <Header
        title="Campanhas"
        subtitle="Gerencie suas campanhas de mídia digital"
      />
      <div className="p-4 lg:p-8">
        <CampanhasClient
          campanhas={campanhas || []}
          clientes={clientes || []}
          traders={usuarios || []}
        />
      </div>
    </div>
  )
}
