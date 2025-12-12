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

    const usuarios = await prisma.usuario.findMany({
      where: { ativo: true },
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        avatarUrl: true,
      },
      orderBy: { nome: 'asc' },
    })

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(data.password, 12)

    const usuario = await prisma.usuario.create({
      data: {
        email: data.email,
        senha: hashedPassword,
        nome: data.nome,
        role: data.role || 'trader',
        whatsapp: data.whatsapp || null,
        ativo: true,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
      },
    })

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
