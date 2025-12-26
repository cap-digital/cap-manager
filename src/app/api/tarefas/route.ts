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

    const { data: tarefas, error } = await supabaseAdmin
      .from('tarefas')
      .select(`
        *,
        projetos:projeto_id (*,
          clientes:cliente_id (*)
        ),
        clientes:cliente_id (*),
        usuarios:responsavel_id (*)
      `)
      .order('status', { ascending: true })
      .order('ordem', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json(tarefas)
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
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

    const insertData = {
      titulo: data.titulo,
      descricao: data.descricao || null,
      status: data.status || 'backlog',
      prioridade: data.prioridade || 'media',
      projeto_id: data.projeto_id || null,
      cliente_id: data.cliente_id || null,
      responsavel_id: data.responsavel_id || null,
      data_vencimento: data.data_vencimento || null,
      ordem: data.ordem || 0,
    }

    const { data: tarefa, error } = await supabaseAdmin
      .from('tarefas')
      .insert(insertData)
      .select(`
        *,
        projetos:projeto_id (*,
          clientes:cliente_id (*)
        ),
        clientes:cliente_id (*),
        usuarios:responsavel_id (*)
      `)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(tarefa)
  } catch (error) {
    console.error('Erro ao criar tarefa:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { id, ...updateData } = data

    const supabaseUpdateData: Record<string, any> = {}

    if (updateData.titulo) supabaseUpdateData.titulo = updateData.titulo
    if (updateData.descricao !== undefined) supabaseUpdateData.descricao = updateData.descricao
    if (updateData.status) supabaseUpdateData.status = updateData.status
    if (updateData.prioridade) supabaseUpdateData.prioridade = updateData.prioridade
    if (updateData.ordem !== undefined) supabaseUpdateData.ordem = updateData.ordem
    if (updateData.responsavel_id !== undefined) supabaseUpdateData.responsavel_id = updateData.responsavel_id

    const { data: tarefa, error } = await supabaseAdmin
      .from('tarefas')
      .update(supabaseUpdateData)
      .eq('id', id)
      .select(`
        *,
        projetos:projeto_id (*,
          clientes:cliente_id (*)
        ),
        clientes:cliente_id (*),
        usuarios:responsavel_id (*)
      `)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(tarefa)
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error)
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
      .from('tarefas')
      .delete()
      .eq('id', Number(id))

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
