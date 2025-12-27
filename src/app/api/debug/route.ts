import { NextResponse } from 'next/server'
import { supabaseAdmin, TABLES } from '@/lib/supabase'

export async function GET() {
  try {
    // Verificar variáveis de ambiente
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    }

    // Testar conexão com Supabase
    const { data: users, error } = await supabaseAdmin
      .from(TABLES.usuarios)
      .select('id, email, nome, role, ativo, senha')
      .limit(5)

    if (error) {
      return NextResponse.json({
        status: 'error',
        envCheck,
        supabaseError: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
      })
    }

    // Verificar se usuários têm senha
    const usersInfo = users?.map(u => ({
      id: u.id,
      email: u.email,
      nome: u.nome,
      role: u.role,
      ativo: u.ativo,
      hasPassword: u.senha && u.senha.length > 0,
    }))

    return NextResponse.json({
      status: 'ok',
      envCheck,
      usersCount: users?.length || 0,
      users: usersInfo,
      tablesConfig: TABLES,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'exception',
      error: error.message,
      stack: error.stack,
    })
  }
}
