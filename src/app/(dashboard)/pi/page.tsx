import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { PiClient } from './pi-client'

export default async function PiPage() {
  const pis = await prisma.pi.findMany({
    include: {
      _count: {
        select: { projetos: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const pisFormatted = pis.map(pi => ({
    id: pi.id,
    identificador: pi.identificador,
    valor_bruto: Number(pi.valorBruto),
    projetos_count: pi._count.projetos,
    created_at: pi.createdAt.toISOString(),
    updated_at: pi.updatedAt.toISOString(),
  }))

  return (
    <div>
      <Header title="PIs" subtitle="Gerencie os Pedidos de Inserção" />
      <div className="p-4 lg:p-8">
        <PiClient pis={pisFormatted} />
      </div>
    </div>
  )
}
