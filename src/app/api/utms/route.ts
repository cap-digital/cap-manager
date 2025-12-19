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

    const utms = await prisma.utmConfig.findMany({
      include: {
        projeto: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(utms)
  } catch (error) {
    console.error('Erro ao buscar UTMs:', error)
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

    const utm = await prisma.utmConfig.create({
      data: {
        projetoId: data.projeto_id || null,
        utmSource: data.utm_source,
        utmMedium: data.utm_medium,
        utmCampaign: data.utm_campaign,
        utmTerm: data.utm_term || null,
        utmContent: data.utm_content || null,
        urlDestino: data.url_destino,
        urlGerada: data.url_gerada,
      },
      include: {
        projeto: true,
      },
    })

    return NextResponse.json(utm)
  } catch (error) {
    console.error('Erro ao criar UTM:', error)
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

    await prisma.utmConfig.delete({
      where: { id: Number(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar UTM:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
