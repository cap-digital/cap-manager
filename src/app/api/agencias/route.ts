import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: agencias, error } = await supabaseAdmin
      .from(TABLES.agencias)
      .select(`*, clientes:${TABLES.clientes}(count)`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar agências:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Formatar os dados para corresponder à estrutura anterior
    const formattedAgencias = agencias?.map((agencia) => ({
      ...agencia,
      _count: {
        clientes: agencia.clientes?.[0]?.count || 0,
      },
    }))

    return NextResponse.json(formattedAgencias)
  } catch (error) {
    console.error('Erro ao buscar agências:', error)
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

    const { data: agencia, error } = await supabaseAdmin
      .from(TABLES.agencias)
      .insert({
        nome: data.nome,
        cnpj: data.cnpj || null,
        telefone: data.telefone || null,
        email: data.email || null,
        contato: data.contato || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar agência:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    revalidatePath('/', 'layout')
    return NextResponse.json(agencia)
  } catch (error) {
    console.error('Erro ao criar agência:', error)
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

    const { data: agencia, error } = await supabaseAdmin
      .from(TABLES.agencias)
      .update({
        nome: data.nome,
        cnpj: data.cnpj || null,
        telefone: data.telefone || null,
        email: data.email || null,
        contato: data.contato || null,
      })
      .eq('id', parseInt(id))
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar agência:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    revalidatePath('/', 'layout')
    return NextResponse.json(agencia)
  } catch (error) {
    console.error('Erro ao atualizar agência:', error)
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
      .from(TABLES.agencias)
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      console.error('Erro ao excluir agência:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    revalidatePath('/', 'layout')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir agência:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
