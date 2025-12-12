import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { UTMGenerator } from './utm-generator'

export default async function UTMPage() {
  const supabase = await createClient()

  const [{ data: campanhasData }, { data: utmConfigsData }] = await Promise.all([
    supabase
      .from('cap_manager_campanhas')
      .select('id, nome, cliente:cap_manager_clientes(nome)')
      .order('created_at', { ascending: false }),
    supabase
      .from('cap_manager_utm_configs')
      .select('*, campanha:cap_manager_campanhas(id, nome)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  // Transform data to match expected types
  const campanhas = (campanhasData || []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    nome: c.nome as string,
    cliente: Array.isArray(c.cliente) ? (c.cliente[0] as { nome: string } | null) : (c.cliente as { nome: string } | null),
  }))

  const utmConfigs = (utmConfigsData || []).map((u: Record<string, unknown>) => ({
    id: u.id as string,
    campanha_id: u.campanha_id as string,
    campanha: Array.isArray(u.campanha) ? (u.campanha[0] as { id: string; nome: string } | null) : (u.campanha as { id: string; nome: string } | null),
    utm_source: u.utm_source as string,
    utm_medium: u.utm_medium as string,
    utm_campaign: u.utm_campaign as string,
    utm_term: u.utm_term as string | null,
    utm_content: u.utm_content as string | null,
    url_destino: u.url_destino as string,
    url_gerada: u.url_gerada as string,
    created_at: u.created_at as string,
  }))

  return (
    <div>
      <Header title="Gerador de UTM" subtitle="Crie links rastreáveis para suas campanhas" />
      <div className="p-4 lg:p-8">
        <UTMGenerator campanhas={campanhas} utmConfigs={utmConfigs} />
      </div>
    </div>
  )
}
