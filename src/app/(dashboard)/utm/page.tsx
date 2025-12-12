import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { UTMGenerator } from './utm-generator'

export default async function UTMPage() {
  const [campanhas, utmConfigs] = await Promise.all([
    prisma.campanha.findMany({
      select: {
        id: true,
        nome: true,
        cliente: { select: { nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.utmConfig.findMany({
      include: {
        campanha: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  // Transform data to match expected types
  const campanhasFormatted = campanhas.map(c => ({
    id: c.id,
    nome: c.nome,
    cliente: c.cliente,
  }))

  const utmConfigsFormatted = utmConfigs.map(u => ({
    id: u.id,
    campanha_id: u.campanhaId || '',
    campanha: u.campanha,
    utm_source: u.utmSource,
    utm_medium: u.utmMedium,
    utm_campaign: u.utmCampaign,
    utm_term: u.utmTerm,
    utm_content: u.utmContent,
    url_destino: u.urlDestino,
    url_gerada: u.urlGerada,
    created_at: u.createdAt.toISOString(),
  }))

  return (
    <div>
      <Header title="Gerador de UTM" subtitle="Crie links rastreáveis para suas campanhas" />
      <div className="p-4 lg:p-8">
        <UTMGenerator campanhas={campanhasFormatted} utmConfigs={utmConfigsFormatted} />
      </div>
    </div>
  )
}
