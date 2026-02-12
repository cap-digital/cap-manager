import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { SimpleKanban } from '@/components/kanban/simple-kanban'
import { Header } from '@/components/layout/header'

export default async function RelatoriosPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        return <div>Não autorizado</div>
    }

    // Buscar cards
    const { data: cards, error: cardsError } = await supabaseAdmin
        .from(TABLES.cards_kanban)
        .select('*')
        .eq('area', 'relatorios')
        .order('ordem', { ascending: true })

    if (cardsError) {
        console.error('Erro ao buscar cards:', cardsError)
    }

    // Buscar dados auxiliares
    const { data: projetos } = await supabaseAdmin
        .from(TABLES.projetos)
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome', { ascending: true })

    const { data: clientes } = await supabaseAdmin
        .from(TABLES.clientes)
        .select('id, nome')
        .order('nome', { ascending: true })

    const { data: usuarios } = await supabaseAdmin
        .from(TABLES.usuarios)
        .select('id, nome')
        .eq('ativo', true)
        .order('nome', { ascending: true })

    // Transformar IDs para números
    const cardsFormatted = cards?.map(card => ({
        ...card,
        clienteId: card.cliente_id,
        projetoId: card.projeto_id,
        traderId: card.trader_id,
        responsavelRelatorioId: card.responsavel_relatorio_id,
        responsavelRevisaoId: card.responsavel_revisao_id,
        revisaoRelatorioOk: card.revisao_relatorio_ok,
        linkRelatorio: card.link_relatorio,
        dataVencimento: card.data_vencimento,
        observadorId: card.observador_id,
        categoria: card.categoria,
        createdAt: card.created_at,
        updatedAt: card.updated_at,
    })) || []

    return (
        <div>
            <Header title="Relatórios" subtitle="Gerencie os relatórios das campanhas" />
            <div className="p-4 lg:p-8">
                <SimpleKanban
                    area="relatorios"
                    areaLabel="Relatórios"
                    cards={cardsFormatted}
                    projetos={projetos || []}
                    clientes={clientes || []}
                    usuarios={usuarios || []}
                    usuarioLogadoId={parseInt(session.user.id)}
                />
            </div>
        </div>
    )
}
