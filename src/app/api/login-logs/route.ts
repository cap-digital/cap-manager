import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from(TABLES.login_logs)
    .select(`
      usuario_id,
      provider,
      created_at,
      cap_manager_usuarios!inner(nome, email, role, avatar_url, ativo)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate per user
  const usersMap = new Map<number, {
    usuario_id: number
    nome: string
    email: string
    role: string
    avatar_url: string | null
    ativo: boolean
    login_count: number
    ultimo_login: string
    providers: string[]
  }>()

  for (const row of data || []) {
    const user = (row as any).cap_manager_usuarios
    const existing = usersMap.get(row.usuario_id)

    if (!existing) {
      usersMap.set(row.usuario_id, {
        usuario_id: row.usuario_id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        ativo: user.ativo,
        login_count: 1,
        ultimo_login: row.created_at,
        providers: [row.provider],
      })
    } else {
      existing.login_count++
      if (!existing.providers.includes(row.provider)) {
        existing.providers.push(row.provider)
      }
    }
  }

  const result = Array.from(usersMap.values()).sort((a, b) =>
    new Date(b.ultimo_login).getTime() - new Date(a.ultimo_login).getTime()
  )

  return NextResponse.json(result)
}
