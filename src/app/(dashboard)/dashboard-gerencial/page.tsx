import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { DashboardGerencialClient } from './dashboard-gerencial-client'

export const metadata: Metadata = {
    title: 'Dashboard Gerencial',
    description: 'Visão geral de estratégias FEE e TD',
}

export default async function DashboardGerencialPage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/login')

    // Buscar projetos com estratégias e clientes
    const { data: projetos, error } = await supabaseAdmin
        .from(TABLES.projetos)
        .select(`
      *,
      cliente:cap_manager_clientes (id, nome),
      estrategias:cap_manager_estrategias (*)
    `)
        .order('created_at', { ascending: false })

    const { data: contratos } = await supabaseAdmin
        .from(TABLES.contratos)
        .select('*')
        .eq('ativo', true)

    if (error) {
        console.error('Erro ao buscar dados para dashboard:', error)
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Dashboard Gerencial" subtitle="Visão consolidada de FEE e TD" />
            <div className="flex-1 p-4 lg:p-8 space-y-6">
                <DashboardGerencialClient initialProjetos={projetos || []} initialContratos={contratos || []} />
            </div>
        </div>
    )
}
