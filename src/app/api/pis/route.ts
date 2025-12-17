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

    const pis = await prisma.pi.findMany({
      include: {
        agencia: true,
        cliente: true,
        _count: {
          select: { projetos: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(pis)
  } catch (error) {
    console.error('Erro ao buscar PIs:', error)
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

    // Verificar se identificador já existe
    const existing = await prisma.pi.findUnique({
      where: { identificador: data.identificador },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Este identificador de PI já existe' },
        { status: 400 }
      )
    }

    const pi = await prisma.pi.create({
      data: {
        identificador: data.identificador,
        valorBruto: data.valor_bruto,
        agenciaId: data.agencia_id || null,
        clienteId: data.cliente_id || null,
      },
      include: {
        agencia: true,
        cliente: true,
      },
    })

    return NextResponse.json(pi)
  } catch (error) {
    console.error('Erro ao criar PI:', error)
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

    // Verificar se identificador já existe em outro PI
    const existing = await prisma.pi.findFirst({
      where: {
        identificador: data.identificador,
        id: { not: parseInt(id) },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Este identificador de PI já existe' },
        { status: 400 }
      )
    }

    const pi = await prisma.pi.update({
      where: { id: parseInt(id) },
      data: {
        identificador: data.identificador,
        valorBruto: data.valor_bruto,
        agenciaId: data.agencia_id || null,
        clienteId: data.cliente_id || null,
      },
      include: {
        agencia: true,
        cliente: true,
      },
    })

    return NextResponse.json(pi)
  } catch (error) {
    console.error('Erro ao atualizar PI:', error)
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

    // Verificar se há projetos usando este PI
    const projetosUsando = await prisma.projeto.count({
      where: { piId: parseInt(id) },
    })

    if (projetosUsando > 0) {
      return NextResponse.json(
        { error: `Este PI está sendo usado por ${projetosUsando} projeto(s)` },
        { status: 400 }
      )
    }

    await prisma.pi.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir PI:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
