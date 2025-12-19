import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { nome, email, senha } = await request.json()

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
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
    const hashedPassword = await bcrypt.hash(senha, 12)

    // Criar usuário como trader (cargo padrão)
    const usuario = await prisma.usuario.create({
      data: {
        email,
        senha: hashedPassword,
        nome,
        role: 'trader',
        ativo: true,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso!',
      usuario,
    })
  } catch (error) {
    console.error('Erro ao criar conta:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
