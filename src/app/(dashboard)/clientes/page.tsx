import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ClientesClient } from './clientes-client'

export default async function ClientesPage() {
  const supabase = await createClient()

  const [{ data: clientes }, { data: agencias }] = await Promise.all([
    supabase
      .from('cap_manager_clientes')
      .select('*, agencia:cap_manager_agencias(*)')
      .order('nome', { ascending: true }),
    supabase.from('cap_manager_agencias').select('*').order('nome', { ascending: true }),
  ])

  return (
    <div>
      <Header title="Clientes" subtitle="Gerencie seus clientes" />
      <div className="p-4 lg:p-8">
        <ClientesClient clientes={clientes || []} agencias={agencias || []} />
      </div>
    </div>
  )
}
