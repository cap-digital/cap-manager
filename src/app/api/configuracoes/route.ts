import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'

// GET - Buscar configurações do usuário logado
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // @ts-ignore
    const userId = session.user.id

    const { data: usuario, error } = await supabaseAdmin
      .from(TABLES.usuarios)
      .select('id, email, nome, whatsapp, email_notificacoes')
      .eq('id', userId)
      .single()

    if (error || !usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      whatsapp: usuario.whatsapp || '',
      email_notificacoes: usuario.email_notificacoes || usuario.email || '',
    })
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT - Atualizar configurações do usuário logado
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // @ts-ignore
    const userId = session.user.id
    const data = await request.json()

    const updateData: {
      whatsapp?: string | null
      email_notificacoes?: string | null
    } = {}

    // Limpar WhatsApp (remover caracteres não numéricos)
    if (data.whatsapp !== undefined) {
      const cleanedWhatsapp = data.whatsapp.replace(/\D/g, '')
      updateData.whatsapp = cleanedWhatsapp || null
    }

    // Email de notificações (pode ser diferente do email de login)
    if (data.email_notificacoes !== undefined) {
      updateData.email_notificacoes = data.email_notificacoes?.trim() || null
    }

    const { data: usuario, error } = await supabaseAdmin
      .from(TABLES.usuarios)
      .update(updateData)
      .eq('id', userId)
      .select('id, email, nome, whatsapp, email_notificacoes')
      .single()

    if (error || !usuario) {
      console.error('Erro ao atualizar configurações:', error)
      return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 })
    }

    return NextResponse.json({
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      whatsapp: usuario.whatsapp || '',
      email_notificacoes: usuario.email_notificacoes || usuario.email || '',
    })
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
