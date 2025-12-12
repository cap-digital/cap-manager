import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const campanhas = await prisma.campanha.findMany({
      include: {
        cliente: true,
        trader: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(campanhas)
  } catch (error) {
    console.error('Erro ao buscar campanhas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()

    const campanha = await prisma.campanha.create({
      data: {
        clienteId: data.cliente_id,
        nome: data.nome,
        pi: data.pi || null,
        porcentagemPlataforma: data.porcentagem_plataforma || 0,
        porcentagemAgencia: data.porcentagem_agencia || 0,
        traderId: data.trader_id || null,
        objetivo: data.objetivo,
        status: data.status || 'rascunho',
        idCampanhaPlataforma: data.id_campanha_plataforma,
        dataInicio: data.data_inicio ? new Date(data.data_inicio) : null,
        dataFim: data.data_fim ? new Date(data.data_fim) : null,
        orcamento: data.orcamento || null,
        nomenclaturaPadrao: data.nomenclatura_padrao || null,
      },
      include: {
        cliente: true,
        trader: true,
      },
    })

    return NextResponse.json(campanha)
  } catch (error) {
    console.error('Erro ao criar campanha:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    const data = await request.json()

    const campanha = await prisma.campanha.update({
      where: { id },
      data: {
        clienteId: data.cliente_id,
        nome: data.nome,
        pi: data.pi || null,
        porcentagemPlataforma: data.porcentagem_plataforma || 0,
        porcentagemAgencia: data.porcentagem_agencia || 0,
        traderId: data.trader_id || null,
        objetivo: data.objetivo,
        status: data.status,
        idCampanhaPlataforma: data.id_campanha_plataforma,
        dataInicio: data.data_inicio ? new Date(data.data_inicio) : null,
        dataFim: data.data_fim ? new Date(data.data_fim) : null,
        orcamento: data.orcamento || null,
        nomenclaturaPadrao: data.nomenclatura_padrao || null,
      },
      include: {
        cliente: true,
        trader: true,
      },
    })

    return NextResponse.json(campanha)
  } catch (error) {
    console.error('Erro ao atualizar campanha:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    await prisma.campanha.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir campanha:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
