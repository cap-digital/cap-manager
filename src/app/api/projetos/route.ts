import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { data: projetos, error } = await supabaseAdmin
      .from(TABLES.projetos)
      .select(`
        *,
        clientes:cliente_id(id, nome),
        trader:${TABLES.usuarios}!cap_manager_projetos_trader_id_fkey(id, nome),
        colaborador:${TABLES.usuarios}!cap_manager_projetos_colaborador_id_fkey(id, nome),
        pis:pi_id(id, identificador, valor_bruto),
        agencias:agencia_id(id, nome),
        estrategias:${TABLES.estrategias}(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar projetos:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json(projetos)
  } catch (error) {
    console.error('Erro ao buscar projetos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const data = await request.json()

    // Validação de campos obrigatórios
    if (!data.cliente_id) {
      return NextResponse.json({ error: 'Cliente é obrigatório' }, { status: 400 })
    }
    if (!data.nome || data.nome.trim() === '') {
      return NextResponse.json({ error: 'Nome do projeto é obrigatório' }, { status: 400 })
    }

    const { data: projeto, error } = await supabaseAdmin
      .from(TABLES.projetos)
      .insert({
        cliente_id: data.cliente_id,
        nome: data.nome,
        pi_id: data.pi_id || null,
        tipo_cobranca: data.tipo_cobranca || 'td',
        agencia_id: data.agencia_id || null,
        trader_id: data.trader_id || null,
        colaborador_id: data.colaborador_id || null,
        status: data.status || 'rascunho',
        data_inicio: data.data_inicio || null,
        data_fim: data.data_fim || null,
        link_proposta: data.link_proposta || null,
        url_destino: data.url_destino || null,
        grupo_revisao: data.grupo_revisao || null,
      })
      .select(`
        *,
        clientes:cliente_id(id, nome),
        trader:${TABLES.usuarios}!cap_manager_projetos_trader_id_fkey(id, nome),
        colaborador:${TABLES.usuarios}!cap_manager_projetos_colaborador_id_fkey(id, nome),
        pis:pi_id(id, identificador, valor_bruto),
        agencias:agencia_id(id, nome),
        estrategias:${TABLES.estrategias}(*)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar projeto:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json(projeto)
  } catch (error) {
    console.error('Erro ao criar projeto:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID nao fornecido' }, { status: 400 })
    }

    const data = await request.json()
    console.log('PUT /api/projetos - Dados recebidos:', JSON.stringify(data, null, 2))

    const { data: projeto, error } = await supabaseAdmin
      .from(TABLES.projetos)
      .update({
        cliente_id: data.cliente_id,
        nome: data.nome,
        pi_id: data.pi_id || null,
        tipo_cobranca: data.tipo_cobranca || 'td',
        agencia_id: data.agencia_id || null,
        trader_id: data.trader_id || null,
        colaborador_id: data.colaborador_id || null,
        status: data.status,
        data_inicio: data.data_inicio || null,
        data_fim: data.data_fim || null,
        link_proposta: data.link_proposta || null,
        url_destino: data.url_destino || null,
        grupo_revisao: data.grupo_revisao || null,
      })
      .eq('id', parseInt(id))
      .select(`
        *,
        clientes:cliente_id(id, nome),
        trader:${TABLES.usuarios}!cap_manager_projetos_trader_id_fkey(id, nome),
        colaborador:${TABLES.usuarios}!cap_manager_projetos_colaborador_id_fkey(id, nome),
        pis:pi_id(id, identificador, valor_bruto),
        agencias:agencia_id(id, nome),
        estrategias:${TABLES.estrategias}(*)
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar projeto:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Registrar quem editou via função SQL (contorna cache do PostgREST)
    const userId = session.user?.id ? parseInt(session.user.id as string) : null
    const userName = (session.user?.name as string) || null
    if (userId) {
      await supabaseAdmin.rpc('set_editado_por', {
        p_projeto_id: parseInt(id),
        p_usuario_id: userId,
        p_usuario_nome: userName,
      })
    }

    console.log('PUT /api/projetos - Projeto atualizado:', projeto.id)
    return NextResponse.json({
      ...projeto,
      editado_por_id: userId,
      editado_por_nome: userName,
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID nao fornecido' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from(TABLES.projetos)
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      console.error('Erro ao excluir projeto:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir projeto:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
