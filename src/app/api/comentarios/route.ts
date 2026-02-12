import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { sendNotificationEmail } from '@/lib/mail'

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

        // Detectar menções no comentário (@usuario)
        const mentionRegex = /@([^\s]+)/g
        const mentions = [...data.conteudo.matchAll(mentionRegex)]

        if (mentions.length > 0) {
            // Buscar tarefa para contexto
            const { data: tarefa } = await supabaseAdmin
                .from(TABLES.tarefas)
                .select('id, titulo')
                .eq('id', data.tarefa_id)
                .single()

            // Buscar autor do comentário
            const { data: autor } = await supabaseAdmin
                .from(TABLES.usuarios)
                .select('nome')
                .eq('id', data.usuario_id)
                .single()

            // Buscar todos os usuários mencionados pelo nome
            const mentionedNames = mentions.map(m => m[1])
            const { data: usuariosMencionados } = await supabaseAdmin
                .from(TABLES.usuarios)
                .select('id, nome, email')
                .in('nome', mentionedNames)

            // Enviar email para cada usuário mencionado
            if (usuariosMencionados && tarefa && autor) {
                for (const usuario of usuariosMencionados) {
                    // Não enviar email para o próprio autor
                    if (usuario.id === data.usuario_id) continue

                    if (usuario.email) {
                        console.log(`[EMAIL] Enviando para ${usuario.email}: Menção de ${autor.nome}`)
                        await sendNotificationEmail(
                            usuario.email,
                            usuario.nome,
                            `${autor.nome} mencionou você em uma tarefa`,
                            `"${data.conteudo.slice(0, 200)}${data.conteudo.length > 200 ? '...' : ''}"`,
                            `/tarefas`
                        )

                        // Registrar alerta
                        await supabaseAdmin.from(TABLES.alertas).insert({
                            tipo: 'mencao',
                            titulo: `${autor.nome} mencionou você`,
                            mensagem: `Na tarefa "${tarefa.titulo}": ${data.conteudo.slice(0, 100)}${data.conteudo.length > 100 ? '...' : ''}`,
                            destinatario_id: usuario.id,
                            lido: false,
                        })
                    }
                }
            }
        }

        return NextResponse.json(comentario)
    } catch (error) {
        console.error('Erro ao criar comentário:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
