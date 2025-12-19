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
    const area = searchParams.get('area')

    if (!area) {
      return NextResponse.json({ error: 'Area nao informada' }, { status: 400 })
    }

    const cards = await prisma.cardKanban.findMany({
      where: { area: area as any },
      orderBy: { ordem: 'asc' },
    })

    return NextResponse.json(cards)
  } catch (error) {
    console.error('Erro ao buscar cards:', error)
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

    // Get max ordem for this area and status
    const maxOrdem = await prisma.cardKanban.aggregate({
      where: {
        area: data.area,
        status: data.status || 'backlog',
      },
      _max: { ordem: true },
    })

    const card = await prisma.cardKanban.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao || null,
        area: data.area,
        status: data.status || 'backlog',
        prioridade: data.prioridade || 'media',
        clienteId: data.cliente_id || null,
        projetoId: data.projeto_id || null,
        traderId: data.trader_id || null,
        responsavelRelatorioId: data.responsavel_relatorio_id || null,
        responsavelRevisaoId: data.responsavel_revisao_id || null,
        revisaoRelatorioOk: data.revisao_relatorio_ok || false,
        linkRelatorio: data.link_relatorio || null,
        faturamentoCardId: data.faturamento_card_id || null,
        dataVencimento: data.data_vencimento ? new Date(data.data_vencimento) : null,
        ordem: (maxOrdem._max.ordem || 0) + 1,
      },
    })

    return NextResponse.json(card)
  } catch (error) {
    console.error('Erro ao criar card:', error)
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

    const updateData: any = {}

    if (data.titulo !== undefined) updateData.titulo = data.titulo
    if (data.descricao !== undefined) updateData.descricao = data.descricao
    if (data.status !== undefined) updateData.status = data.status
    if (data.prioridade !== undefined) updateData.prioridade = data.prioridade
    if (data.cliente_id !== undefined) updateData.clienteId = data.cliente_id
    if (data.projeto_id !== undefined) updateData.projetoId = data.projeto_id
    if (data.trader_id !== undefined) updateData.traderId = data.trader_id
    if (data.responsavel_relatorio_id !== undefined) updateData.responsavelRelatorioId = data.responsavel_relatorio_id
    if (data.responsavel_revisao_id !== undefined) updateData.responsavelRevisaoId = data.responsavel_revisao_id
    if (data.revisao_relatorio_ok !== undefined) updateData.revisaoRelatorioOk = data.revisao_relatorio_ok
    if (data.link_relatorio !== undefined) updateData.linkRelatorio = data.link_relatorio
    if (data.data_vencimento !== undefined) {
      updateData.dataVencimento = data.data_vencimento ? new Date(data.data_vencimento) : null
    }
    if (data.ordem !== undefined) updateData.ordem = data.ordem

    const card = await prisma.cardKanban.update({
      where: { id: parseInt(id) },
      data: updateData,
    })

    return NextResponse.json(card)
  } catch (error) {
    console.error('Erro ao atualizar card:', error)
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

    await prisma.cardKanban.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir card:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
