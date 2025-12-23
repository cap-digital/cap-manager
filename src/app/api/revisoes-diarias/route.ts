import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Buscar revisões do dia atual ou de uma data específica
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dataParam = searchParams.get('data')
    const projetoIdParam = searchParams.get('projeto_id')

    const data = dataParam ? new Date(dataParam) : new Date()
    data.setHours(0, 0, 0, 0)

    const where: Record<string, unknown> = {
      dataAgendada: data,
    }

    if (projetoIdParam) {
      where.projetoId = parseInt(projetoIdParam)
    }

    const revisoes = await prisma.revisaoDiaria.findMany({
      where,
      include: {
        projeto: {
          include: {
            cliente: { select: { id: true, nome: true } },
            trader: { select: { id: true, nome: true } },
            estrategias: true,
          },
        },
        revisadoPor: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(revisoes)
  } catch (error) {
    console.error('Erro ao buscar revisões:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Marcar revisão como concluída
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email },
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const data = await request.json()

    if (!data.projeto_id) {
      return NextResponse.json({ error: 'Projeto é obrigatório' }, { status: 400 })
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Verificar se já existe uma revisão para hoje
    const revisaoExistente = await prisma.revisaoDiaria.findUnique({
      where: {
        projetoId_dataAgendada: {
          projetoId: data.projeto_id,
          dataAgendada: hoje,
        },
      },
    })

    let revisao
    if (revisaoExistente) {
      // Atualizar revisão existente
      revisao = await prisma.revisaoDiaria.update({
        where: { id: revisaoExistente.id },
        data: {
          revisado: true,
          dataRevisao: new Date(),
          revisadoPorId: usuario.id,
        },
        include: {
          projeto: {
            include: {
              cliente: { select: { id: true, nome: true } },
              trader: { select: { id: true, nome: true } },
            },
          },
          revisadoPor: { select: { id: true, nome: true } },
        },
      })
    } else {
      // Criar nova revisão
      revisao = await prisma.revisaoDiaria.create({
        data: {
          projetoId: data.projeto_id,
          dataAgendada: hoje,
          revisado: true,
          dataRevisao: new Date(),
          revisadoPorId: usuario.id,
        },
        include: {
          projeto: {
            include: {
              cliente: { select: { id: true, nome: true } },
              trader: { select: { id: true, nome: true } },
            },
          },
          revisadoPor: { select: { id: true, nome: true } },
        },
      })
    }

    return NextResponse.json(revisao)
  } catch (error) {
    console.error('Erro ao criar/atualizar revisão:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
