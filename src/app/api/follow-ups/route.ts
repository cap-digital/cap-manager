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

    const followUps = await prisma.followUp.findMany({
      include: {
        campanha: {
          include: {
            cliente: true,
          },
        },
        trader: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(followUps)
  } catch (error) {
    console.error('Erro ao buscar follow-ups:', error)
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

    const followUp = await prisma.followUp.create({
      data: {
        campanhaId: data.campanha_id,
        traderId: data.trader_id,
        conteudo: data.conteudo,
        tipo: data.tipo || 'nota',
      },
      include: {
        campanha: {
          include: {
            cliente: true,
          },
        },
        trader: true,
      },
    })

    return NextResponse.json(followUp)
  } catch (error) {
    console.error('Erro ao criar follow-up:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
