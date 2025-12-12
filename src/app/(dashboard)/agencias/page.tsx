import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { AgenciasClient } from './agencias-client'

export default async function AgenciasPage() {
  const supabase = await createClient()

  const { data: agencias } = await supabase
    .from('cap_manager_agencias')
    .select('*')
    .order('nome', { ascending: true })

  return (
    <div>
      <Header title="Agências" subtitle="Gerencie as agências parceiras" />
      <div className="p-4 lg:p-8">
        <AgenciasClient agencias={agencias || []} />
      </div>
    </div>
  )
}
