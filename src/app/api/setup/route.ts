import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const admin = await prisma.usuario.findFirst({
      where: { role: 'admin' },
    })

    return NextResponse.json({
      hasAdmin: !!admin,
    })
  } catch {
    return NextResponse.json({
      hasAdmin: false,
    })
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, nome } = await request.json()

    if (!email || !password || !nome) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se já existe admin
    const existingAdmin = await prisma.usuario.findFirst({
      where: { role: 'admin' },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Já existe um administrador cadastrado' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Criar usuário admin
    await prisma.usuario.create({
      data: {
        email,
        senha: hashedPassword,
        nome,
        role: 'admin',
        ativo: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Admin criado com sucesso! Você já pode fazer login.',
    })
  } catch (error) {
    console.error('Erro no setup:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
