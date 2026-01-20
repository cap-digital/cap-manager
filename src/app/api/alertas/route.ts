import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES, TipoAlerta } from '@/lib/supabase'
import { sendNotificationEmail } from '@/lib/mail'

// GET - Buscar alertas do usuário logado
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const unreadOnly = searchParams.get('unread_only') === 'true'
        const limit = parseInt(searchParams.get('limit') || '50')

        // @ts-ignore
        const userId = session.user.id

        let query = supabaseAdmin
            .from(TABLES.alertas)
            .select('*')
            .eq('destinatario_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (unreadOnly) {
            query = query.eq('lido', false)
        }

        const { data: alertas, error } = await query

        if (error) {
            console.error('Erro ao buscar alertas:', error)
            return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
        }

        return NextResponse.json(alertas)
    } catch (error) {
        console.error('Erro ao buscar alertas:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// POST - Criar novo alerta e enviar email
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const data = await request.json()

        // Validação
        if (!data.destinatario_id || !data.titulo || !data.mensagem) {
            return NextResponse.json({ error: 'Campos obrigatórios: destinatario_id, titulo, mensagem' }, { status: 400 })
        }

        // Buscar email do destinatário
        const { data: destinatario, error: userError } = await supabaseAdmin
            .from(TABLES.usuarios)
            .select('email, nome, email_notificacoes')
            .eq('id', data.destinatario_id)
            .single()

        if (userError || !destinatario) {
            console.error('Erro ao buscar destinatário:', userError)
            return NextResponse.json({ error: 'Destinatário não encontrado' }, { status: 404 })
        }

        // Criar alerta no banco
        const { data: alerta, error } = await supabaseAdmin
            .from(TABLES.alertas)
            .insert({
                tipo: data.tipo || 'sistema',
                titulo: data.titulo,
                mensagem: data.mensagem,
                destinatario_id: data.destinatario_id,
                lido: false,
                enviado_whatsapp: false,
            })
            .select()
            .single()

        if (error) {
            console.error('Erro ao criar alerta:', error)
            return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
        }

        // Enviar email para o destinatário
        const emailTo = destinatario.email_notificacoes || destinatario.email
        if (emailTo) {
            try {
                await sendNotificationEmail(
                    emailTo,
                    destinatario.nome,
                    data.titulo,
                    data.mensagem,
                    data.link_acao
                )
            } catch (emailError) {
                console.error('Erro ao enviar email de notificação:', emailError)
                // Não falhar a criação do alerta por causa do email
            }
        }

        return NextResponse.json(alerta)
    } catch (error) {
        console.error('Erro ao criar alerta:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// PATCH - Marcar alertas como lidos
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const alertaId = searchParams.get('id')
        const markAll = searchParams.get('mark_all') === 'true'

        // @ts-ignore
        const userId = session.user.id

        if (markAll) {
            // Marcar todos como lidos
            const { error } = await supabaseAdmin
                .from(TABLES.alertas)
                .update({ lido: true })
                .eq('destinatario_id', userId)
                .eq('lido', false)

            if (error) {
                console.error('Erro ao marcar alertas como lidos:', error)
                return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
            }

            return NextResponse.json({ success: true, message: 'Todos marcados como lidos' })
        } else if (alertaId) {
            // Marcar um específico como lido
            const { error } = await supabaseAdmin
                .from(TABLES.alertas)
                .update({ lido: true })
                .eq('id', parseInt(alertaId))
                .eq('destinatario_id', userId)

            if (error) {
                console.error('Erro ao marcar alerta como lido:', error)
                return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
            }

            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'ID do alerta ou mark_all necessário' }, { status: 400 })
    } catch (error) {
        console.error('Erro ao marcar alerta:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
