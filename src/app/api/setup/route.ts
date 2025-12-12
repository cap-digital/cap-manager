import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Esta rota usa o service role para criar o admin inicial
// O service role bypassa RLS e pode fazer qualquer operação

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Se não tem service key, usar anon key (menos ideal mas funciona)
    const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verificar se já existe admin
    const { data: existingAdmin } = await supabase
      .from('cap_manager_usuarios')
      .select('id')
      .eq('role', 'admin')
      .limit(1)

    if (existingAdmin && existingAdmin.length > 0) {
      return NextResponse.json(
        { error: 'Já existe um administrador cadastrado' },
        { status: 400 }
      )
    }

    // Criar usuário no Auth usando admin API (se tiver service key)
    let userId: string | null = null

    if (supabaseServiceKey) {
      // Com service key, podemos criar usuário diretamente
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto confirma o email
        user_metadata: {
          nome,
          role: 'admin',
        },
      })

      if (authError) {
        console.error('Erro ao criar usuário auth:', authError)
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        )
      }

      userId = authData.user?.id || null
    } else {
      // Sem service key, usar signUp normal
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            role: 'admin',
          },
        },
      })

      if (signUpError) {
        console.error('Erro no signUp:', signUpError)
        return NextResponse.json(
          { error: signUpError.message },
          { status: 400 }
        )
      }

      userId = signUpData.user?.id || null
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Não foi possível criar o usuário' },
        { status: 500 }
      )
    }

    // Aguardar um pouco para o trigger processar (se existir)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verificar se o usuário já foi criado pelo trigger
    const { data: existingUser } = await supabase
      .from('cap_manager_usuarios')
      .select('id')
      .eq('auth_id', userId)
      .single()

    if (!existingUser) {
      // Criar usuário manualmente na tabela
      const { error: insertError } = await supabase
        .from('cap_manager_usuarios')
        .insert({
          auth_id: userId,
          email,
          nome,
          role: 'admin',
          ativo: true,
        })

      if (insertError) {
        console.error('Erro ao inserir usuário:', insertError)
        // Não retornar erro aqui pois o usuário auth foi criado
        // O usuário pode fazer login e criaremos o registro depois
      }
    } else {
      // Garantir que é admin
      await supabase
        .from('cap_manager_usuarios')
        .update({ role: 'admin' })
        .eq('auth_id', userId)
    }

    return NextResponse.json({
      success: true,
      message: supabaseServiceKey
        ? 'Admin criado com sucesso! Você já pode fazer login.'
        : 'Admin criado! Verifique seu email para confirmar o cadastro.',
      needsEmailConfirmation: !supabaseServiceKey,
    })
  } catch (error) {
    console.error('Erro no setup:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
