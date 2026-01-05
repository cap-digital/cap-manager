import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { PiClient } from './pi-client'

export default async function PiPage() {
  const [pisRes, agenciasRes, clientesRes] = await Promise.all([
    supabaseAdmin
      .from(TABLES.pis)
      .select(`*, agencias:${TABLES.agencias}(*), clientes:${TABLES.clientes}(*), projetos:${TABLES.projetos}(count)`)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from(TABLES.agencias)
      .select('id, nome')
      .order('nome', { ascending: true }),
    supabaseAdmin
      .from(TABLES.clientes)
      .select('id, nome, agencia_id')
      .order('nome', { ascending: true }),
  ])

  const pis = pisRes.data || []
  const agencias = agenciasRes.data || []
  const clientes = clientesRes.data || []

  const pisFormatted = pis.map(pi => ({
    id: pi.id,
    identificador: pi.identificador,
    valor_bruto: Number(pi.valor_bruto),
    agencia_id: pi.agencia_id,
    agencia: pi.agencias ? {
      id: pi.agencias.id,
      nome: pi.agencias.nome,
    } : null,
    cliente_id: pi.cliente_id,
    cliente: pi.clientes ? {
      id: pi.clientes.id,
      nome: pi.clientes.nome,
      agencia_id: pi.clientes.agencia_id,
    } : null,
    projetos_count: pi.projetos?.[0]?.count || 0,
    created_at: pi.created_at,
    updated_at: pi.updated_at,
  }))

  const agenciasFormatted = agencias.map(agencia => ({
    id: agencia.id,
    nome: agencia.nome,
  }))

  const clientesFormatted = clientes.map(cliente => ({
    id: cliente.id,
    nome: cliente.nome,
    agencia_id: cliente.agencia_id,
  }))

  return (
    <div>
      <Header title="PIs" subtitle="Gerencie os Pedidos de Inserção" />
      <div className="p-4 lg:p-8">
        <PiClient pis={pisFormatted} agencias={agenciasFormatted} clientes={clientesFormatted} />
      </div>
    </div>
  )
}
