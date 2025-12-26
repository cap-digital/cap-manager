import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, nome, role, whatsapp, ativo, created_at')
      .eq('id', parseInt(id))
      .single()

    if (error || !usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Converter snake_case para camelCase
    const usuarioFormatado = {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      role: usuario.role,
      whatsapp: usuario.whatsapp,
      ativo: usuario.ativo,
      createdAt: usuario.created_at,
    }

    return NextResponse.json(usuarioFormatado)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const updateData: {
      nome?: string
      email?: string
      role?: 'admin' | 'trader' | 'gestor' | 'cliente'
      whatsapp?: string | null
      ativo?: boolean
    } = {}

    if (data.nome !== undefined) updateData.nome = data.nome
    if (data.email !== undefined) updateData.email = data.email
    if (data.role !== undefined) updateData.role = data.role
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp || null
    if (data.ativo !== undefined) updateData.ativo = data.ativo

    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .update(updateData)
      .eq('id', parseInt(id))
      .select('id, email, nome, role, whatsapp, ativo')
      .single()

    if (error || !usuario) {
      console.error('Erro ao atualizar usuário:', error)
      return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
    }

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Soft delete - apenas desativa o usuário
    const { error } = await supabaseAdmin
      .from('usuarios')
      .update({ ativo: false })
      .eq('id', parseInt(id))

    if (error) {
      console.error('Erro ao deletar usuário:', error)
      return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
