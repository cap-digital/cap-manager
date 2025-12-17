import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projetoId = searchParams.get('projeto_id')

    const estrategias = await prisma.estrategia.findMany({
      where: projetoId ? { projetoId: parseInt(projetoId) } : undefined,
      include: {
        projeto: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(estrategias)
  } catch (error) {
    console.error('Erro ao buscar estrategias:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const data = await request.json()

    const estrategia = await prisma.estrategia.create({
      data: {
        projetoId: data.projeto_id,
        plataforma: data.plataforma,
        nomeConta: data.nome_conta || null,
        idConta: data.id_conta || null,
        campaignId: data.campaign_id || null,
        estrategia: data.estrategia || null,
        kpi: data.kpi || null,
        status: data.status || 'planejada',
        valorBruto: data.valor_bruto || 0,
        porcentagemAgencia: data.porcentagem_agencia || 0,
        porcentagemPlataforma: data.porcentagem_plataforma || 0,
        entregaContratada: data.entrega_contratada || null,
        estimativaResultado: data.estimativa_resultado || null,
        estimativaSucesso: data.estimativa_sucesso || null,
        gastoAteMomento: data.gasto_ate_momento || null,
        entregueAteMomento: data.entregue_ate_momento || null,
        dataAtualizacao: data.data_atualizacao ? new Date(data.data_atualizacao) : null,
      },
      include: {
        projeto: { select: { id: true, nome: true } },
      },
    })

    return NextResponse.json(estrategia)
  } catch (error) {
    console.error('Erro ao criar estrategia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID nao fornecido' }, { status: 400 })
    }

    const data = await request.json()

    const estrategia = await prisma.estrategia.update({
      where: { id: parseInt(id) },
      data: {
        plataforma: data.plataforma,
        nomeConta: data.nome_conta || null,
        idConta: data.id_conta || null,
        campaignId: data.campaign_id || null,
        estrategia: data.estrategia || null,
        kpi: data.kpi || null,
        status: data.status,
        valorBruto: data.valor_bruto || 0,
        porcentagemAgencia: data.porcentagem_agencia || 0,
        porcentagemPlataforma: data.porcentagem_plataforma || 0,
        entregaContratada: data.entrega_contratada || null,
        estimativaResultado: data.estimativa_resultado || null,
        estimativaSucesso: data.estimativa_sucesso || null,
        gastoAteMomento: data.gasto_ate_momento || null,
        entregueAteMomento: data.entregue_ate_momento || null,
        dataAtualizacao: data.data_atualizacao ? new Date(data.data_atualizacao) : null,
      },
      include: {
        projeto: { select: { id: true, nome: true } },
      },
    })

    return NextResponse.json(estrategia)
  } catch (error) {
    console.error('Erro ao atualizar estrategia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID nao fornecido' }, { status: 400 })
    }

    await prisma.estrategia.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir estrategia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
