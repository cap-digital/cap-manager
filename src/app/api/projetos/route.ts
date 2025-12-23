import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const projetos = await prisma.projeto.findMany({
      include: {
        cliente: { select: { id: true, nome: true } },
        trader: { select: { id: true, nome: true } },
        colaborador: { select: { id: true, nome: true } },
        pi: { select: { id: true, identificador: true, valorBruto: true } },
        agencia: { select: { id: true, nome: true } },
        estrategias: true,
        _count: { select: { estrategias: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(projetos)
  } catch (error) {
    console.error('Erro ao buscar projetos:', error)
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

    // Validação de campos obrigatórios
    if (!data.cliente_id) {
      return NextResponse.json({ error: 'Cliente é obrigatório' }, { status: 400 })
    }
    if (!data.nome || data.nome.trim() === '') {
      return NextResponse.json({ error: 'Nome do projeto é obrigatório' }, { status: 400 })
    }

    const projeto = await prisma.projeto.create({
      data: {
        clienteId: data.cliente_id,
        nome: data.nome,
        piId: data.pi_id || null,
        tipoCobranca: data.tipo_cobranca || 'td',
        agenciaId: data.agencia_id || null,
        traderId: data.trader_id || null,
        colaboradorId: data.colaborador_id || null,
        status: data.status || 'rascunho',
        dataInicio: data.data_inicio ? new Date(data.data_inicio) : null,
        dataFim: data.data_fim ? new Date(data.data_fim) : null,
        linkProposta: data.link_proposta || null,
        urlDestino: data.url_destino || null,
        grupoRevisao: data.grupo_revisao || null,
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        trader: { select: { id: true, nome: true } },
        colaborador: { select: { id: true, nome: true } },
        pi: { select: { id: true, identificador: true, valorBruto: true } },
        agencia: { select: { id: true, nome: true } },
        estrategias: true,
      },
    })

    return NextResponse.json(projeto)
  } catch (error) {
    console.error('Erro ao criar projeto:', error)
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

    const projeto = await prisma.projeto.update({
      where: { id: parseInt(id) },
      data: {
        clienteId: data.cliente_id,
        nome: data.nome,
        piId: data.pi_id || null,
        tipoCobranca: data.tipo_cobranca || 'td',
        agenciaId: data.agencia_id || null,
        traderId: data.trader_id || null,
        colaboradorId: data.colaborador_id || null,
        status: data.status,
        dataInicio: data.data_inicio ? new Date(data.data_inicio) : null,
        dataFim: data.data_fim ? new Date(data.data_fim) : null,
        linkProposta: data.link_proposta || null,
        urlDestino: data.url_destino || null,
        grupoRevisao: data.grupo_revisao || null,
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        trader: { select: { id: true, nome: true } },
        colaborador: { select: { id: true, nome: true } },
        pi: { select: { id: true, identificador: true, valorBruto: true } },
        agencia: { select: { id: true, nome: true } },
        estrategias: true,
      },
    })

    return NextResponse.json(projeto)
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error)
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

    await prisma.projeto.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir projeto:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
