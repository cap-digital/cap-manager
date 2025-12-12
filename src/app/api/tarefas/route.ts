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

    const tarefas = await prisma.tarefa.findMany({
      include: {
        campanha: {
          include: {
            cliente: true,
          },
        },
        cliente: true,
        responsavel: true,
      },
      orderBy: [{ status: 'asc' }, { ordem: 'asc' }],
    })

    return NextResponse.json(tarefas)
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
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

    const tarefa = await prisma.tarefa.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao || null,
        status: data.status || 'backlog',
        prioridade: data.prioridade || 'media',
        campanhaId: data.campanha_id || null,
        clienteId: data.cliente_id || null,
        responsavelId: data.responsavel_id || null,
        dataVencimento: data.data_vencimento ? new Date(data.data_vencimento) : null,
        ordem: data.ordem || 0,
      },
      include: {
        campanha: {
          include: {
            cliente: true,
          },
        },
        cliente: true,
        responsavel: true,
      },
    })

    return NextResponse.json(tarefa)
  } catch (error) {
    console.error('Erro ao criar tarefa:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { id, ...updateData } = data

    const tarefa = await prisma.tarefa.update({
      where: { id },
      data: {
        ...(updateData.titulo && { titulo: updateData.titulo }),
        ...(updateData.descricao !== undefined && { descricao: updateData.descricao }),
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.prioridade && { prioridade: updateData.prioridade }),
        ...(updateData.ordem !== undefined && { ordem: updateData.ordem }),
        ...(updateData.responsavel_id !== undefined && { responsavelId: updateData.responsavel_id }),
      },
      include: {
        campanha: {
          include: {
            cliente: true,
          },
        },
        cliente: true,
        responsavel: true,
      },
    })

    return NextResponse.json(tarefa)
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
