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

    const agencias = await prisma.agencia.findMany({
      include: {
        _count: {
          select: { clientes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(agencias)
  } catch (error) {
    console.error('Erro ao buscar agências:', error)
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

    const agencia = await prisma.agencia.create({
      data: {
        nome: data.nome,
        porcentagem: data.porcentagem || 0,
        local: data.local,
      },
    })

    return NextResponse.json(agencia)
  } catch (error) {
    console.error('Erro ao criar agência:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
