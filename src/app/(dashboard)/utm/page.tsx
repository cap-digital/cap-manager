import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { UTMGenerator } from './utm-generator'

export default async function UTMPage() {
  const [projetos, utmConfigs] = await Promise.all([
    prisma.projeto.findMany({
      select: {
        id: true,
        nome: true,
        cliente: { select: { nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.utmConfig.findMany({
      include: {
        projeto: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  // Transform data to match expected types
  const projetosFormatted = projetos.map(p => ({
    id: p.id,
    nome: p.nome,
    cliente: p.cliente,
  }))

  const utmConfigsFormatted = utmConfigs.map(u => ({
    id: u.id,
    projeto_id: u.projetoId || '',
    projeto: u.projeto,
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
      <Header title="Gerador de UTM" subtitle="Crie links rastreáveis para seus projetos" />
      <div className="p-4 lg:p-8">
        <UTMGenerator projetos={projetosFormatted} utmConfigs={utmConfigsFormatted} />
      </div>
    </div>
  )
}
