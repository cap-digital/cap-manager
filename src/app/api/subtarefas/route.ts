import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'

// GET - List subtarefas for a tarefa (campanha)
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const tarefaId = searchParams.get('tarefa_id')

        if (!tarefaId) {
            return NextResponse.json({ error: 'tarefa_id é obrigatório' }, { status: 400 })
        }

        const { data: subtarefas, error } = await supabaseAdmin
            .from(TABLES.subtarefas)
            .select(`
        *,
        responsavel:responsavel_id (id, nome)
      `)
            .eq('tarefa_id', parseInt(tarefaId))
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Erro ao buscar subtarefas:', error)
            return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
        }

        return NextResponse.json(subtarefas)
    } catch (error) {
        console.error('Erro ao buscar subtarefas:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// POST - Create subtarefa
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const data = await request.json()

        if (!data.tarefa_id || !data.titulo) {
            return NextResponse.json({ error: 'tarefa_id e titulo são obrigatórios' }, { status: 400 })
        }

        // Create subtarefa
        const { data: subtarefa, error } = await supabaseAdmin
            .from(TABLES.subtarefas)
            .insert({
                tarefa_id: data.tarefa_id,
                titulo: data.titulo,
                descricao: data.descricao || null,
                prioridade: data.prioridade || 'media',
                data_vencimento: data.data_vencimento || null,
                responsavel_id: data.responsavel_id || null,
                data_finalizacao: data.data_finalizacao || null,
                concluida: false,
            })
            .select(`
        *,
        responsavel:responsavel_id (id, nome)
      `)
            .single()

        if (error) {
            console.error('Erro ao criar subtarefa:', error)
            return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
        }

        // Create log entry
        await supabaseAdmin.from(TABLES.subtarefa_logs).insert({
            subtarefa_id: subtarefa.id,
            usuario_id: null,
            acao: 'criada',
            descricao: `Subtarefa "${data.titulo}" criada`,
        })

        return NextResponse.json(subtarefa)
    } catch (error) {
        console.error('Erro ao criar subtarefa:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// PATCH - Update subtarefa (toggle concluida, edit data)
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const data = await request.json()
        const { id, ...updateData } = data

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
        }

        // Get current state for logging
        const { data: current } = await supabaseAdmin
            .from(TABLES.subtarefas)
            .select('*')
            .eq('id', id)
            .single()

        // Prepare update
        const supabaseUpdateData: Record<string, unknown> = {}
        if (updateData.titulo !== undefined) supabaseUpdateData.titulo = updateData.titulo
        if (updateData.descricao !== undefined) supabaseUpdateData.descricao = updateData.descricao
        if (updateData.prioridade !== undefined) supabaseUpdateData.prioridade = updateData.prioridade
        if (updateData.data_vencimento !== undefined) supabaseUpdateData.data_vencimento = updateData.data_vencimento
        if (updateData.responsavel_id !== undefined) supabaseUpdateData.responsavel_id = updateData.responsavel_id
        if (updateData.data_finalizacao !== undefined) supabaseUpdateData.data_finalizacao = updateData.data_finalizacao
        if (updateData.concluida !== undefined) supabaseUpdateData.concluida = updateData.concluida

        const { data: subtarefa, error } = await supabaseAdmin
            .from(TABLES.subtarefas)
            .update(supabaseUpdateData)
            .eq('id', id)
            .select(`
        *,
        responsavel:responsavel_id (id, nome)
      `)
            .single()

        if (error) {
            console.error('Erro ao atualizar subtarefa:', error)
            return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
        }

        // Create log entry based on what changed
        let acao = 'atualizada'
        let descricao = 'Subtarefa atualizada'

        if (updateData.concluida !== undefined && current) {
            if (updateData.concluida && !current.concluida) {
                acao = 'concluida'
                descricao = `Subtarefa "${subtarefa.titulo}" marcada como concluída`
            } else if (!updateData.concluida && current.concluida) {
                acao = 'reaberta'
                descricao = `Subtarefa "${subtarefa.titulo}" reaberta`
            }
        }

        await supabaseAdmin.from(TABLES.subtarefa_logs).insert({
            subtarefa_id: id,
            usuario_id: null,
            acao,
            descricao,
        })

        return NextResponse.json(subtarefa)
    } catch (error) {
        console.error('Erro ao atualizar subtarefa:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// DELETE - Remove subtarefa
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
            .from(TABLES.subtarefas)
            .delete()
            .eq('id', parseInt(id))

        if (error) {
            console.error('Erro ao excluir subtarefa:', error)
            return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao excluir subtarefa:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// GET logs for a subtarefa
export async function OPTIONS(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const subtarefaId = searchParams.get('subtarefa_id')

        if (!subtarefaId) {
            return NextResponse.json({ error: 'subtarefa_id é obrigatório' }, { status: 400 })
        }

        const { data: logs, error } = await supabaseAdmin
            .from(TABLES.subtarefa_logs)
            .select(`
        *,
        usuario:usuario_id (id, nome)
      `)
            .eq('subtarefa_id', parseInt(subtarefaId))
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Erro ao buscar logs:', error)
            return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
        }

        return NextResponse.json(logs)
    } catch (error) {
        console.error('Erro ao buscar logs:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
