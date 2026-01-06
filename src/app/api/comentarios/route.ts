import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'

// GET - List comments for a task
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

        const { data: comentarios, error } = await supabaseAdmin
            .from(TABLES.comentarios_tarefa)
            .select(`
        *,
        usuario:usuario_id (id, nome)
      `)
            .eq('tarefa_id', parseInt(tarefaId))
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Erro ao buscar comentários:', error)
            return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
        }

        return NextResponse.json(comentarios)
    } catch (error) {
        console.error('Erro ao buscar comentários:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// POST - Create comment
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const data = await request.json()

        if (!data.tarefa_id || !data.conteudo || !data.usuario_id) {
            return NextResponse.json({ error: 'tarefa_id, usuario_id e conteudo são obrigatórios' }, { status: 400 })
        }

        const { data: comentario, error } = await supabaseAdmin
            .from(TABLES.comentarios_tarefa)
            .insert({
                tarefa_id: data.tarefa_id,
                usuario_id: data.usuario_id,
                conteudo: data.conteudo,
            })
            .select(`
        *,
        usuario:usuario_id (id, nome)
      `)
            .single()

        if (error) {
            console.error('Erro ao criar comentário:', error)
            return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
        }

        return NextResponse.json(comentario)
    } catch (error) {
        console.error('Erro ao criar comentário:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
