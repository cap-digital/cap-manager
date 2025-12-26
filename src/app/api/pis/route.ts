import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: pis, error } = await supabaseAdmin
      .from(TABLES.pis)
      .select(`*, agencias:${TABLES.agencias}(*), clientes:${TABLES.clientes}(*), projetos:${TABLES.projetos}(count)`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar PIs:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json(pis)
  } catch (error) {
    console.error('Erro ao buscar PIs:', error)
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

    // Verificar se identificador já existe
    const { data: existing } = await supabaseAdmin
      .from(TABLES.pis)
      .select('id')
      .eq('identificador', data.identificador)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Este identificador de PI já existe' },
        { status: 400 }
      )
    }

    const { data: pi, error } = await supabaseAdmin
      .from(TABLES.pis)
      .insert({
        identificador: data.identificador,
        valor_bruto: data.valor_bruto,
        agencia_id: data.agencia_id || null,
        cliente_id: data.cliente_id || null,
      })
      .select(`*, agencias:${TABLES.agencias}(*), clientes:${TABLES.clientes}(*)`)
      .single()

    if (error) {
      console.error('Erro ao criar PI:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json(pi)
  } catch (error) {
    console.error('Erro ao criar PI:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    const data = await request.json()

    // Verificar se identificador já existe em outro PI
    const { data: existing } = await supabaseAdmin
      .from(TABLES.pis)
      .select('id')
      .eq('identificador', data.identificador)
      .neq('id', parseInt(id))
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Este identificador de PI já existe' },
        { status: 400 }
      )
    }

    const { data: pi, error } = await supabaseAdmin
      .from(TABLES.pis)
      .update({
        identificador: data.identificador,
        valor_bruto: data.valor_bruto,
        agencia_id: data.agencia_id || null,
        cliente_id: data.cliente_id || null,
      })
      .eq('id', parseInt(id))
      .select(`*, agencias:${TABLES.agencias}(*), clientes:${TABLES.clientes}(*)`)
      .single()

    if (error) {
      console.error('Erro ao atualizar PI:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json(pi)
  } catch (error) {
    console.error('Erro ao atualizar PI:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    // Verificar se há projetos usando este PI
    const { count: projetosUsando } = await supabaseAdmin
      .from(TABLES.projetos)
      .select('*', { count: 'exact', head: true })
      .eq('pi_id', parseInt(id))

    if (projetosUsando && projetosUsando > 0) {
      return NextResponse.json(
        { error: `Este PI está sendo usado por ${projetosUsando} projeto(s)` },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from(TABLES.pis)
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      console.error('Erro ao excluir PI:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir PI:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
