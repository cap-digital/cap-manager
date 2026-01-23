import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { InteligenciaProjetosClient } from './inteligencia-projetos-client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function InteligenciaProjetosPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    // Fetch data
    const [projetosRes, clientesRes, usuariosRes] = await Promise.all([
        supabaseAdmin
            .from(TABLES.inteligencia_projetos)
            .select(`
                *, 
                cliente:${TABLES.clientes}(nome),
                feito_por:${TABLES.usuarios}(nome),
                revisado_por:${TABLES.usuarios}(nome)
            `)
            .order('created_at', { ascending: false }),
        supabaseAdmin
            .from(TABLES.clientes)
            .select('id, nome')
            .eq('ativo', true)
            .order('nome', { ascending: true }),
        supabaseAdmin
            .from(TABLES.usuarios)
            .select('id, nome')
            .eq('ativo', true)
            .order('nome', { ascending: true })
    ])

    const projetos = projetosRes.data || []
    const clientes = clientesRes.data || []
    const usuarios = usuariosRes.data || []

    return (
        <div>
            <Header
                title="Projetos de Inteligência"
                subtitle="Controle técnico de projetos, sites e automações"
            />
            <div className="p-4 lg:p-8">
                <InteligenciaProjetosClient
                    projetos={projetos as any}
                    clientes={clientes as any}
                    usuarios={usuarios as any}
                />
            </div>
        </div>
    )
}
