import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin, TABLES } from '@/lib/supabase'

export async function GET() {
  try {
    // Log para debug
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'definida' : 'NÃO DEFINIDA')
    console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'definida' : 'NÃO DEFINIDA')

    const { count, error } = await supabaseAdmin
      .from(TABLES.usuarios)
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')

    if (error) {
      console.error('Erro Supabase:', error)
      throw error
    }

    return NextResponse.json({
      hasAdmin: (count ?? 0) > 0,
    })
  } catch (error: any) {
    console.error('Erro ao verificar admin:', error)
    return NextResponse.json(
      {
        error: 'Erro ao verificar configuração',
        details: error?.message || error?.code || JSON.stringify(error),
        code: error?.code,
        hint: error?.hint,
        hasAdmin: true
      },
      { status: 500 }
    )
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
    const { data: existingAdmin, error: adminCheckError } = await supabaseAdmin
      .from(TABLES.usuarios)
      .select('id')
      .eq('role', 'admin')
      .single()

    if (adminCheckError && adminCheckError.code !== 'PGRST116') {
      throw adminCheckError
    }

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Já existe um administrador cadastrado' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from(TABLES.usuarios)
      .select('id')
      .eq('email', email)
      .single()

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      throw userCheckError
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Criar usuário admin
    const { error: insertError } = await supabaseAdmin
      .from(TABLES.usuarios)
      .insert({
        email,
        senha: hashedPassword,
        nome,
        role: 'admin',
        ativo: true,
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

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
