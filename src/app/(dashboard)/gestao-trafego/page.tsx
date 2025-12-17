import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { GestaoTrafegoKanban } from './gestao-trafego-kanban'

export default async function GestaoTrafegoPage() {
  const [cards, projetos, clientes, usuarios] = await Promise.all([
    prisma.cardKanban.findMany({
      where: { area: 'gestao_trafego' },
      orderBy: { ordem: 'asc' },
    }),
    prisma.projeto.findMany({
      include: {
        cliente: { select: { id: true, nome: true } },
        trader: { select: { id: true, nome: true } },
      },
      orderBy: { nome: 'asc' },
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

  const cardsFormatted = cards.map(card => ({
    id: card.id,
    titulo: card.titulo,
    descricao: card.descricao,
    area: card.area,
    status: card.status,
    prioridade: card.prioridade as 'baixa' | 'media' | 'alta' | 'urgente',
    cliente_id: card.clienteId,
    projeto_id: card.projetoId,
    trader_id: card.traderId,
    responsavel_relatorio_id: card.responsavelRelatorioId,
    responsavel_revisao_id: card.responsavelRevisaoId,
    revisao_relatorio_ok: card.revisaoRelatorioOk,
    link_relatorio: card.linkRelatorio,
    data_vencimento: card.dataVencimento?.toISOString().split('T')[0] || null,
    ordem: card.ordem,
    created_at: card.createdAt.toISOString(),
    updated_at: card.updatedAt.toISOString(),
  }))

  const projetosFormatted = projetos.map(p => ({
    id: p.id,
    nome: p.nome,
    tipo_cobranca: p.tipoCobranca,
    data_fim: p.dataFim?.toISOString().split('T')[0] || null,
    revisao_final_ok: p.revisaoFinalOk,
    cliente: p.cliente,
    trader: p.trader,
  }))

  return (
    <div>
      <Header title="Gestao de Trafego" subtitle="Gerencie suas campanhas de trafego com Kanban" />
      <div className="p-4 lg:p-8">
        <GestaoTrafegoKanban
          cards={cardsFormatted}
          projetos={projetosFormatted}
          clientes={clientes}
          usuarios={usuarios}
        />
      </div>
    </div>
  )
}
