import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { ProjetosClient } from './projetos-client'

export default async function ProjetosPage() {
  const [projetos, clientes, usuarios, pis, agencias] = await Promise.all([
    prisma.projeto.findMany({
      include: {
        cliente: { select: { id: true, nome: true } },
        trader: { select: { id: true, nome: true } },
        pi: { select: { id: true, identificador: true, valorBruto: true } },
        agencia: { select: { id: true, nome: true, porcentagem: true } },
        estrategias: true,
        _count: { select: { estrategias: true } },
      },
      orderBy: { createdAt: 'desc' },
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
    prisma.pi.findMany({
      select: { id: true, identificador: true, valorBruto: true },
      orderBy: { identificador: 'asc' },
    }),
    prisma.agencia.findMany({
      select: { id: true, nome: true, porcentagem: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  // Transform data to snake_case for frontend
  const projetosFormatted = projetos.map(projeto => ({
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
      porcentagem: Number(projeto.agencia.porcentagem),
    } : null,
    trader_id: projeto.traderId,
    trader: projeto.trader,
    status: projeto.status,
    data_inicio: projeto.dataInicio?.toISOString().split('T')[0] || null,
    data_fim: projeto.dataFim?.toISOString().split('T')[0] || null,
    link_proposta: projeto.linkProposta,
    praca: projeto.praca,
    publico: projeto.publico,
    url_destino: projeto.urlDestino,
    estrategias_count: projeto._count.estrategias,
    estrategias: projeto.estrategias.map(e => ({
      id: e.id,
      projeto_id: e.projetoId,
      plataforma: e.plataforma,
      nome_conta: e.nomeConta,
      id_conta: e.idConta,
      estrategia: e.estrategia,
      kpi: e.kpi,
      status: e.status,
      valor_bruto: Number(e.valorBruto),
      porcentagem_agencia: Number(e.porcentagemAgencia),
      porcentagem_plataforma: Number(e.porcentagemPlataforma),
      entrega_contratada: e.entregaContratada ? Number(e.entregaContratada) : null,
      gasto_ate_momento: e.gastoAteMomento ? Number(e.gastoAteMomento) : null,
      entregue_ate_momento: e.entregueAteMomento ? Number(e.entregueAteMomento) : null,
      data_atualizacao: e.dataAtualizacao?.toISOString() || null,
      created_at: e.createdAt.toISOString(),
      updated_at: e.updatedAt.toISOString(),
    })),
    created_at: projeto.createdAt.toISOString(),
    updated_at: projeto.updatedAt.toISOString(),
  }))

  const pisFormatted = pis.map(pi => ({
    id: pi.id,
    identificador: pi.identificador,
    valor_bruto: Number(pi.valorBruto),
  }))

  const agenciasFormatted = agencias.map(agencia => ({
    id: agencia.id,
    nome: agencia.nome,
    porcentagem: Number(agencia.porcentagem),
  }))

  return (
    <div>
      <Header
        title="Projetos"
        subtitle="Gerencie seus projetos e estrategias de midia"
      />
      <div className="p-4 lg:p-8">
        <ProjetosClient
          projetos={projetosFormatted}
          clientes={clientes}
          traders={usuarios}
          pis={pisFormatted}
          agencias={agenciasFormatted}
        />
      </div>
    </div>
  )
}
