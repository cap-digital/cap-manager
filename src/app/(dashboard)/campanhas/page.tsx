import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { CampanhasClient } from './campanhas-client'

export default async function CampanhasPage() {
  const [campanhas, clientes, usuarios] = await Promise.all([
    prisma.campanha.findMany({
      include: {
        cliente: { select: { id: true, nome: true } },
        trader: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.cliente.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.usuario.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  // Transform data to match expected types (snake_case for frontend compatibility)
  const campanhasFormatted = campanhas.map(campanha => ({
    id: campanha.id,
    cliente_id: campanha.clienteId,
    cliente: campanha.cliente,
    nome: campanha.nome,
    pi: campanha.pi,
    porcentagem_plataforma: Number(campanha.porcentagemPlataforma),
    porcentagem_agencia: Number(campanha.porcentagemAgencia),
    trader_id: campanha.traderId,
    trader: campanha.trader,
    objetivo: campanha.objetivo,
    status: campanha.status,
    id_campanha_plataforma: campanha.idCampanhaPlataforma,
    data_inicio: campanha.dataInicio?.toISOString().split('T')[0] || null,
    data_fim: campanha.dataFim?.toISOString().split('T')[0] || null,
    orcamento: campanha.orcamento ? Number(campanha.orcamento) : null,
    nomenclatura_padrao: campanha.nomenclaturaPadrao,
    created_at: campanha.createdAt.toISOString(),
    updated_at: campanha.updatedAt.toISOString(),
  }))

  return (
    <div>
      <Header
        title="Campanhas"
        subtitle="Gerencie suas campanhas de mídia digital"
      />
      <div className="p-4 lg:p-8">
        <CampanhasClient
          campanhas={campanhasFormatted}
          clientes={clientes}
          traders={usuarios}
        />
      </div>
    </div>
  )
}
