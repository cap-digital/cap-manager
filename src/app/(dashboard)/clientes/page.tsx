import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { ClientesClient } from './clientes-client'

export default async function ClientesPage() {
  const [clientes, agencias] = await Promise.all([
    prisma.cliente.findMany({
      include: { agencia: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.agencia.findMany({
      orderBy: { nome: 'asc' },
    }),
  ])

  // Transform data to match expected types (snake_case for frontend compatibility)
  const clientesFormatted = clientes.map(cliente => ({
    id: cliente.id,
    nome: cliente.nome,
    agencia_id: cliente.agenciaId,
    agencia: cliente.agencia ? {
      id: cliente.agencia.id,
      nome: cliente.agencia.nome,
      cnpj: cliente.agencia.cnpj,
      telefone: cliente.agencia.telefone,
      email: cliente.agencia.email,
      contato: cliente.agencia.contato,
      created_at: cliente.agencia.createdAt.toISOString(),
      updated_at: cliente.agencia.updatedAt.toISOString(),
    } : null,
    contato: cliente.contato,
    cnpj: cliente.cnpj,
    email: cliente.email,
    whatsapp: cliente.whatsapp,
    tipo_cobranca: cliente.tipoCobranca,
    ativo: cliente.ativo,
    created_at: cliente.createdAt.toISOString(),
    updated_at: cliente.updatedAt.toISOString(),
  }))

  const agenciasFormatted = agencias.map(agencia => ({
    id: agencia.id,
    nome: agencia.nome,
    cnpj: agencia.cnpj,
    telefone: agencia.telefone,
    email: agencia.email,
    contato: agencia.contato,
    created_at: agencia.createdAt.toISOString(),
    updated_at: agencia.updatedAt.toISOString(),
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
