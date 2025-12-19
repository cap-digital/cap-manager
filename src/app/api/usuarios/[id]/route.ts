import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        whatsapp: true,
        ativo: true,
        createdAt: true,
      },
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const updateData: {
      nome?: string
      email?: string
      role?: 'admin' | 'trader' | 'gestor' | 'cliente'
      whatsapp?: string | null
      ativo?: boolean
    } = {}

    if (data.nome !== undefined) updateData.nome = data.nome
    if (data.email !== undefined) updateData.email = data.email
    if (data.role !== undefined) updateData.role = data.role
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp || null
    if (data.ativo !== undefined) updateData.ativo = data.ativo

    const usuario = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        whatsapp: true,
        ativo: true,
      },
    })

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Soft delete - apenas desativa o usuário
    await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { ativo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
