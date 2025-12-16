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

    const clientes = await prisma.cliente.findMany({
      include: {
        agencia: true,
        _count: {
          select: { projetos: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(clientes)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
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

    const cliente = await prisma.cliente.create({
      data: {
        nome: data.nome,
        agenciaId: data.agencia_id || null,
        linkDrive: data.link_drive || null,
        contato: data.contato,
        cnpj: data.cnpj || null,
        email: data.email,
        diaCobranca: data.dia_cobranca || 1,
        formaPagamento: data.forma_pagamento || 'pix',
        whatsapp: data.whatsapp || null,
        ativo: true,
      },
      include: {
        agencia: true,
      },
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
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

    const cliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data: {
        nome: data.nome,
        agenciaId: data.agencia_id || null,
        linkDrive: data.link_drive || null,
        contato: data.contato,
        cnpj: data.cnpj || null,
        email: data.email,
        diaCobranca: data.dia_cobranca || 1,
        formaPagamento: data.forma_pagamento || 'pix',
        whatsapp: data.whatsapp || null,
      },
      include: {
        agencia: true,
      },
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
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

    await prisma.cliente.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
