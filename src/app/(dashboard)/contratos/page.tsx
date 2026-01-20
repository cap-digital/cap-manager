import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { ContratosClient } from './contratos-client'

export const metadata: Metadata = {
    title: 'Contratos',
    description: 'Gestão de contratos e fee',
}

export default async function ContratosPage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/login')

    const [contratosRes, clientesRes] = await Promise.all([
        supabaseAdmin
            .from(TABLES.contratos)
            .select('*, cliente:cap_manager_clientes(id, nome)')
            .order('created_at', { ascending: false }),
        supabaseAdmin
            .from(TABLES.clientes)
            .select('id, nome')
            .eq('ativo', true)
            .order('nome', { ascending: true })
    ])

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Contratos" subtitle="Gerencie contratos e recorrências" />
            <div className="flex-1 p-4 lg:p-8">
                <ContratosClient
                    initialContratos={contratosRes.data || []}
                    clientes={clientesRes.data || []}
                />
            </div>
        </div>
    )
}
