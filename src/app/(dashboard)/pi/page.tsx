import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { PiClient } from './pi-client'

export default async function PiPage() {
  const [pis, agencias, clientes] = await Promise.all([
    prisma.pi.findMany({
      include: {
        agencia: true,
        cliente: true,
        _count: {
          select: { projetos: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.agencia.findMany({
      orderBy: { nome: 'asc' },
    }),
    prisma.cliente.findMany({
      orderBy: { nome: 'asc' },
    }),
  ])

  const pisFormatted = pis.map(pi => ({
    id: pi.id,
    identificador: pi.identificador,
    valor_bruto: Number(pi.valorBruto),
    agencia_id: pi.agenciaId,
    agencia: pi.agencia ? {
      id: pi.agencia.id,
      nome: pi.agencia.nome,
    } : null,
    cliente_id: pi.clienteId,
    cliente: pi.cliente ? {
      id: pi.cliente.id,
      nome: pi.cliente.nome,
      agencia_id: pi.cliente.agenciaId,
    } : null,
    projetos_count: pi._count.projetos,
    created_at: pi.createdAt.toISOString(),
    updated_at: pi.updatedAt.toISOString(),
  }))

  const agenciasFormatted = agencias.map(agencia => ({
    id: agencia.id,
    nome: agencia.nome,
  }))

  const clientesFormatted = clientes.map(cliente => ({
    id: cliente.id,
    nome: cliente.nome,
    agencia_id: cliente.agenciaId,
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
