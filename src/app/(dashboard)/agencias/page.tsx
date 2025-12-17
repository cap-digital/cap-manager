import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { AgenciasClient } from './agencias-client'

export default async function AgenciasPage() {
  const agencias = await prisma.agencia.findMany({
    orderBy: { nome: 'asc' },
  })

  // Transform data to match expected types
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
      <Header title="Agências" subtitle="Gerencie as agências parceiras" />
      <div className="p-4 lg:p-8">
        <AgenciasClient agencias={agenciasFormatted} />
      </div>
    </div>
  )
}
