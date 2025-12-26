import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'

// GET - Buscar revisões do dia atual ou de uma data específica
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dataParam = searchParams.get('data')
    const projetoIdParam = searchParams.get('projeto_id')

    const data = dataParam ? new Date(dataParam) : new Date()
    data.setHours(0, 0, 0, 0)

    let query = supabaseAdmin
      .from(TABLES.revisoes_diarias)
      .select(`
        *,
        projetos:${TABLES.projetos} (
          *,
          clientes:cliente_id (id, nome),
          traders:trader_id (id, nome),
          estrategias:${TABLES.estrategias} (*)
        ),
        usuarios:revisado_por_id (id, nome)
      `)
      .eq('data_agendada', data.toISOString().split('T')[0])

    if (projetoIdParam) {
      query = query.eq('projeto_id', parseInt(projetoIdParam))
    }

    const { data: revisoes, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar revisões:', error)
      return NextResponse.json({ error: 'Erro ao buscar revisões' }, { status: 500 })
    }

    return NextResponse.json(revisoes)
  } catch (error) {
    console.error('Erro ao buscar revisões:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Marcar revisão como concluída
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from(TABLES.usuarios)
      .select('*')
      .eq('email', session.user.email)
      .single()

    if (usuarioError || !usuario) {
      console.error('Erro ao buscar usuário:', usuarioError)
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const data = await request.json()

    if (!data.projeto_id) {
      return NextResponse.json({ error: 'Projeto é obrigatório' }, { status: 400 })
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Verificar se já existe uma revisão para hoje
    const { data: revisaoExistente, error: checkError } = await supabaseAdmin
      .from(TABLES.revisoes_diarias)
      .select('*')
      .eq('projeto_id', data.projeto_id)
      .eq('data_agendada', hoje.toISOString().split('T')[0])
      .single()

    let revisao
    if (revisaoExistente && !checkError) {
      // Atualizar revisão existente
      const { data: revisaoAtualizada, error: updateError } = await supabaseAdmin
        .from(TABLES.revisoes_diarias)
        .update({
          revisado: true,
          data_revisao: new Date().toISOString(),
          revisado_por_id: usuario.id,
        })
        .eq('id', revisaoExistente.id)
        .select(`
          *,
          projetos:${TABLES.projetos} (
            *,
            clientes:cliente_id (id, nome),
            traders:trader_id (id, nome)
          ),
          usuarios:revisado_por_id (id, nome)
        `)
        .single()

      if (updateError) {
        console.error('Erro ao atualizar revisão:', updateError)
        return NextResponse.json({ error: 'Erro ao atualizar revisão' }, { status: 500 })
      }

      revisao = revisaoAtualizada
    } else {
      // Criar nova revisão
      const { data: novaRevisao, error: createError } = await supabaseAdmin
        .from(TABLES.revisoes_diarias)
        .insert({
          projeto_id: data.projeto_id,
          data_agendada: hoje.toISOString().split('T')[0],
          revisado: true,
          data_revisao: new Date().toISOString(),
          revisado_por_id: usuario.id,
        })
        .select(`
          *,
          projetos:${TABLES.projetos} (
            *,
            clientes:cliente_id (id, nome),
            traders:trader_id (id, nome)
          ),
          usuarios:revisado_por_id (id, nome)
        `)
        .single()

      if (createError) {
        console.error('Erro ao criar revisão:', createError)
        return NextResponse.json({ error: 'Erro ao criar revisão' }, { status: 500 })
      }

      revisao = novaRevisao
    }

    return NextResponse.json(revisao)
  } catch (error) {
    console.error('Erro ao criar/atualizar revisão:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
