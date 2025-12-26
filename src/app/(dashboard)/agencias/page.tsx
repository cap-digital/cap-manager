import { supabaseAdmin } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { AgenciasClient } from './agencias-client'

export default async function AgenciasPage() {
  const { data: agencias } = await supabaseAdmin
    .from('agencias')
    .select('*')
    .order('nome', { ascending: true })

  const agenciasFormatted = (agencias || []).map(agencia => ({
    id: agencia.id,
    nome: agencia.nome,
    cnpj: agencia.cnpj,
    telefone: agencia.telefone,
    email: agencia.email,
    contato: agencia.contato,
    created_at: agencia.created_at,
    updated_at: agencia.updated_at,
  }))

  return (
    <div>
      <Header title="Agências" subtitle="Gerencie as agências parceiras" />
      <div className="p-4 lg:p-8">
        <AgenciasClient agencias={agenciasFormatted} />
      </div>
    </div>
  )
}
