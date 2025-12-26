import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { ProjetoDetalhesClient } from './projeto-detalhes-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjetoDetalhesPage({ params }: PageProps) {
  const { id } = await params
  const projetoId = parseInt(id)

  if (isNaN(projetoId)) {
    notFound()
  }

  const [projeto, usuarios, pis, agencias, clientes] = await Promise.all([
    prisma.projeto.findUnique({
      where: { id: projetoId },
      include: {
        cliente: { select: { id: true, nome: true } },
        trader: { select: { id: true, nome: true } },
        colaborador: { select: { id: true, nome: true } },
        pi: { select: { id: true, identificador: true, valorBruto: true } },
        agencia: { select: { id: true, nome: true } },
        estrategias: true,
      },
    }),
    prisma.usuario.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.pi.findMany({
      select: { id: true, identificador: true, valorBruto: true },
      orderBy: { identificador: 'asc' },
    }),
    prisma.agencia.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.cliente.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  if (!projeto) {
    notFound()
  }

  // Transform data to snake_case for frontend
  const projetoFormatted = {
    id: projeto.id,
    cliente_id: projeto.clienteId,
    cliente: projeto.cliente,
    nome: projeto.nome,
    pi_id: projeto.piId,
    pi: projeto.pi ? {
      id: projeto.pi.id,
      identificador: projeto.pi.identificador,
      valor_bruto: Number(projeto.pi.valorBruto),
    } : null,
    tipo_cobranca: projeto.tipoCobranca,
    agencia_id: projeto.agenciaId,
    agencia: projeto.agencia ? {
      id: projeto.agencia.id,
      nome: projeto.agencia.nome,
    } : null,
    trader_id: projeto.traderId,
    trader: projeto.trader,
    colaborador_id: projeto.colaboradorId,
    colaborador: projeto.colaborador,
    status: projeto.status,
    data_inicio: projeto.dataInicio?.toISOString().split('T')[0] || null,
    data_fim: projeto.dataFim?.toISOString().split('T')[0] || null,
    link_proposta: projeto.linkProposta,
    url_destino: projeto.urlDestino,
    grupo_revisao: projeto.grupoRevisao,
    estrategias: projeto.estrategias.map(e => ({
      id: e.id,
      projeto_id: e.projetoId,
      plataforma: e.plataforma,
      nome_conta: e.nomeConta,
      id_conta: e.idConta,
      campaign_id: e.campaignId,
      estrategia: e.estrategia,
      kpi: e.kpi,
      status: e.status,
      data_inicio: e.dataInicio?.toISOString().split('T')[0] || null,
      valor_bruto: Number(e.valorBruto),
      porcentagem_agencia: Number(e.porcentagemAgencia),
      porcentagem_plataforma: Number(e.porcentagemPlataforma),
      entrega_contratada: e.entregaContratada ? Number(e.entregaContratada) : null,
      gasto_ate_momento: e.gastoAteMomento ? Number(e.gastoAteMomento) : null,
      entregue_ate_momento: e.entregueAteMomento ? Number(e.entregueAteMomento) : null,
      data_atualizacao: e.dataAtualizacao?.toISOString().split('T')[0] || null,
      // Valores calculados
      valor_liquido: e.valorLiquido ? Number(e.valorLiquido) : null,
      valor_plataforma: e.valorPlataforma ? Number(e.valorPlataforma) : null,
      coeficiente: e.coeficiente ? Number(e.coeficiente) : null,
      valor_por_dia_plataforma: e.valorPorDiaPlataforma ? Number(e.valorPorDiaPlataforma) : null,
      valor_restante: e.valorRestante ? Number(e.valorRestante) : null,
      restante_por_dia: e.restantePorDia ? Number(e.restantePorDia) : null,
      percentual_entrega: e.percentualEntrega ? Number(e.percentualEntrega) : null,
      estimativa_resultado: e.estimativaResultado ? Number(e.estimativaResultado) : null,
      estimativa_sucesso: e.estimativaSucesso ? Number(e.estimativaSucesso) : null,
      meta_custo_resultado: e.metaCustoResultado ? Number(e.metaCustoResultado) : null,
      custo_resultado: e.custoResultado ? Number(e.custoResultado) : null,
      gasto_ate_momento_bruto: e.gastoAteMomentoBruto ? Number(e.gastoAteMomentoBruto) : null,
      valor_restante_bruto: e.valorRestanteBruto ? Number(e.valorRestanteBruto) : null,
      pode_abaixar_margem: e.podeAbaixarMargem,
      pode_aumentar_margem: e.podeAumentarMargem,
      created_at: e.createdAt.toISOString(),
      updated_at: e.updatedAt.toISOString(),
    })),
    created_at: projeto.createdAt.toISOString(),
    updated_at: projeto.updatedAt.toISOString(),
  }

  const pisFormatted = pis.map(pi => ({
    id: pi.id,
    identificador: pi.identificador,
    valor_bruto: Number(pi.valorBruto),
  }))

  const agenciasFormatted = agencias.map(agencia => ({
    id: agencia.id,
    nome: agencia.nome,
  }))

  return (
    <div>
      <Header
        title={projeto.nome}
        subtitle={projeto.cliente?.nome || 'Detalhes do projeto'}
        backHref="/projetos"
      />
      <div className="p-4 lg:p-8">
        <ProjetoDetalhesClient
          projeto={projetoFormatted}
          traders={usuarios}
          pis={pisFormatted}
          agencias={agenciasFormatted}
          clientes={clientes}
        />
      </div>
    </div>
  )
}
