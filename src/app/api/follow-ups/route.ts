import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: followUps, error } = await supabaseAdmin
      .from('follow_ups')
      .select(`
        *,
        projetos:projeto_id (
          *,
          clientes:cliente_id (*)
        ),
        usuarios:trader_id (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar follow-ups:', error)
      return NextResponse.json({ error: 'Erro ao buscar follow-ups' }, { status: 500 })
    }

    return NextResponse.json(followUps)
  } catch (error) {
    console.error('Erro ao buscar follow-ups:', error)
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

    const { data: followUp, error } = await supabaseAdmin
      .from('follow_ups')
      .insert({
        projeto_id: data.projeto_id,
        trader_id: data.trader_id,
        conteudo: data.conteudo,
        tipo: data.tipo || 'nota',
      })
      .select(`
        *,
        projetos:projeto_id (
          *,
          clientes:cliente_id (*)
        ),
        usuarios:trader_id (*)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar follow-up:', error)
      return NextResponse.json({ error: 'Erro ao criar follow-up' }, { status: 500 })
    }

    return NextResponse.json(followUp)
  } catch (error) {
    console.error('Erro ao criar follow-up:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
