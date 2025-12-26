import { supabaseAdmin } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { ClientesClient } from './clientes-client'

export default async function ClientesPage() {
  const [clientesResult, agenciasResult] = await Promise.all([
    supabaseAdmin
      .from('clientes')
      .select('*, agencia:agencias!clientes_agencia_id_fkey(*)')
      .order('nome', { ascending: true }),
    supabaseAdmin
      .from('agencias')
      .select('*')
      .order('nome', { ascending: true }),
  ])

  const clientes = clientesResult.data || []
  const agencias = agenciasResult.data || []

  // Transform data to match expected types (snake_case for frontend compatibility)
  const clientesFormatted = clientes.map(cliente => ({
    id: cliente.id,
    nome: cliente.nome,
    agencia_id: cliente.agencia_id,
    agencia: cliente.agencia ? {
      id: cliente.agencia.id,
      nome: cliente.agencia.nome,
      cnpj: cliente.agencia.cnpj,
      telefone: cliente.agencia.telefone,
      email: cliente.agencia.email,
      contato: cliente.agencia.contato,
      created_at: cliente.agencia.created_at,
      updated_at: cliente.agencia.updated_at,
    } : null,
    contato: cliente.contato,
    cnpj: cliente.cnpj,
    email: cliente.email,
    whatsapp: cliente.whatsapp,
    tipo_cobranca: cliente.tipo_cobranca,
    ativo: cliente.ativo,
    created_at: cliente.created_at,
    updated_at: cliente.updated_at,
  }))

  const agenciasFormatted = agencias.map(agencia => ({
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
      <Header title="Clientes" subtitle="Gerencie seus clientes" />
      <div className="p-4 lg:p-8">
        <ClientesClient clientes={clientesFormatted} agencias={agenciasFormatted} />
      </div>
    </div>
  )
}
