import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const area = searchParams.get('area')

    if (!area) {
      return NextResponse.json({ error: 'Area nao informada' }, { status: 400 })
    }

    const { data: cards, error } = await supabaseAdmin
      .from(TABLES.cards_kanban)
      .select('*')
      .eq('area', area)
      .order('ordem', { ascending: true })

    if (error) {
      console.error('Erro ao buscar cards:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json(cards)
  } catch (error) {
    console.error('Erro ao buscar cards:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const data = await request.json()

    // Get max ordem for this area and status
    const { data: maxOrdemData, error: maxOrdemError } = await supabaseAdmin
      .from(TABLES.cards_kanban)
      .select('ordem')
      .eq('area', data.area)
      .eq('status', data.status || 'backlog')
      .order('ordem', { ascending: false })
      .limit(1)

    const maxOrdem = maxOrdemData && maxOrdemData.length > 0 ? maxOrdemData[0].ordem : 0

    const { data: card, error } = await supabaseAdmin
      .from(TABLES.cards_kanban)
      .insert({
        titulo: data.titulo,
        descricao: data.descricao || null,
        area: data.area,
        status: data.status || 'backlog',
        prioridade: data.prioridade || 'media',
        cliente_id: data.cliente_id || null,
        projeto_id: data.projeto_id || null,
        trader_id: data.trader_id || null,
        responsavel_relatorio_id: data.responsavel_relatorio_id || null,
        responsavel_revisao_id: data.responsavel_revisao_id || null,
        revisao_relatorio_ok: data.revisao_relatorio_ok || false,
        link_relatorio: data.link_relatorio || null,
        faturamento_card_id: data.faturamento_card_id || null,
        data_vencimento: data.data_vencimento || null,

        ordem: maxOrdem + 1,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar card:', error)
      return NextResponse.json({
        error: error.message || 'Erro interno ao criar card',
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json(card)
  } catch (error: any) {
    console.error('Erro ao criar card:', error)
    return NextResponse.json({
      error: error.message || 'Erro interno não tratado',
      stack: error.stack
    }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID nao fornecido' }, { status: 400 })
    }

    const data = await request.json()

    const updateData: any = {}

    if (data.titulo !== undefined) updateData.titulo = data.titulo
    if (data.descricao !== undefined) updateData.descricao = data.descricao
    if (data.status !== undefined) updateData.status = data.status
    if (data.prioridade !== undefined) updateData.prioridade = data.prioridade
    if (data.cliente_id !== undefined) updateData.cliente_id = data.cliente_id
    if (data.projeto_id !== undefined) updateData.projeto_id = data.projeto_id
    if (data.trader_id !== undefined) updateData.trader_id = data.trader_id
    if (data.responsavel_relatorio_id !== undefined) updateData.responsavel_relatorio_id = data.responsavel_relatorio_id
    if (data.responsavel_revisao_id !== undefined) updateData.responsavel_revisao_id = data.responsavel_revisao_id
    if (data.link_relatorio !== undefined) updateData.link_relatorio = data.link_relatorio
    if (data.data_vencimento !== undefined) updateData.data_vencimento = data.data_vencimento

    if (data.ordem !== undefined) updateData.ordem = data.ordem

    const { data: card, error } = await supabaseAdmin
      .from(TABLES.cards_kanban)
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar card:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json(card)
  } catch (error) {
    console.error('Erro ao atualizar card:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID nao fornecido' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from(TABLES.cards_kanban)
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      console.error('Erro ao excluir card:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir card:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
