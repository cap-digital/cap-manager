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

    const { data: clientes, error } = await supabaseAdmin
      .from('clientes')
      .select('*, agencias(*), projetos(count)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar clientes:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Transform data to match expected format
    const transformedClientes = clientes?.map((cliente) => ({
      ...cliente,
      agencia: cliente.agencias,
      _count: {
        projetos: cliente.projetos?.[0]?.count || 0,
      },
    }))

    return NextResponse.json(transformedClientes)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
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

    const { data: cliente, error } = await supabaseAdmin
      .from('clientes')
      .insert({
        nome: data.nome,
        agencia_id: data.agencia_id || null,
        contato: data.contato || null,
        cnpj: data.cnpj || null,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
        tipo_cobranca: data.tipo_cobranca || 'td',
        ativo: true,
      })
      .select('*, agencias(*)')
      .single()

    if (error) {
      console.error('Erro ao criar cliente:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Transform data to match expected format
    const transformedCliente = {
      ...cliente,
      agencia: cliente.agencias,
    }

    return NextResponse.json(transformedCliente)
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
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

    const { data: cliente, error } = await supabaseAdmin
      .from('clientes')
      .update({
        nome: data.nome,
        agencia_id: data.agencia_id || null,
        contato: data.contato || null,
        cnpj: data.cnpj || null,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
        tipo_cobranca: data.tipo_cobranca || 'td',
      })
      .eq('id', parseInt(id))
      .select('*, agencias(*)')
      .single()

    if (error) {
      console.error('Erro ao atualizar cliente:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Transform data to match expected format
    const transformedCliente = {
      ...cliente,
      agencia: cliente.agencias,
    }

    return NextResponse.json(transformedCliente)
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
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

    const { error } = await supabaseAdmin
      .from('clientes')
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      console.error('Erro ao excluir cliente:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
