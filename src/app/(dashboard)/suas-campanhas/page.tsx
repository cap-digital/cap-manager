import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { SuasCampanhasClient } from './suas-campanhas-client'
import { redirect } from 'next/navigation'

export default async function SuasCampanhasPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect('/login')
    }

    const userId = Number((session.user as any).id)

    // Fetch projects where user is trader OR collaborator
    const { data: projetos, error } = await supabaseAdmin
        .from(TABLES.projetos)
        .select(`
      *,
      estrategias:cap_manager_estrategias(*),
      cliente:cap_manager_clientes!cap_manager_projetos_cliente_id_fkey(id, nome)
    `)
        .or(`trader_id.eq.${userId},colaborador_id.eq.${userId}`)
        .order('nome', { ascending: true })

    if (error) {
        console.error('Erro ao buscar projetos:', error)
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950/50">
            <Header
                title="Suas Campanhas"
                subtitle="Visão consolidada de todas as suas estratégias ativas"
            />
            <div className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-slide-in">
                <SuasCampanhasClient projetos={projetos || []} userId={userId} userName={session.user.name || ''} />
            </div>
        </div>
    )
}
