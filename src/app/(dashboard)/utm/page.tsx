import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { UTMGenerator } from './utm-generator'

export default async function UTMPage() {
  const [projetosRes, utmConfigsRes] = await Promise.all([
    supabaseAdmin
      .from(TABLES.projetos)
      .select('id, nome, clientes:cliente_id(nome)')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from(TABLES.utm_configs)
      .select('*, projetos:projeto_id(id, nome)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const projetos = projetosRes.data || []
  const utmConfigs = utmConfigsRes.data || []

  // Transform data to match expected types (Supabase returns relations as arrays)
  const projetosFormatted = projetos.map(p => ({
    id: p.id,
    nome: p.nome,
    cliente: Array.isArray(p.clientes) ? p.clientes[0] || null : p.clientes,
  }))

  const utmConfigsFormatted = utmConfigs.map(u => ({
    id: u.id,
    projeto_id: u.projeto_id,
    projeto: Array.isArray(u.projetos) ? u.projetos[0] || null : u.projetos,
    utm_source: u.utm_source,
    utm_medium: u.utm_medium,
    utm_campaign: u.utm_campaign,
    utm_term: u.utm_term,
    utm_content: u.utm_content,
    url_destino: u.url_destino,
    url_gerada: u.url_gerada,
    created_at: u.created_at,
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
