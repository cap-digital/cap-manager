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

    const { data: clientes, error } = await supabaseAdmin
      .from(TABLES.clientes)
      .select(`*, agencias:${TABLES.agencias}(*), projetos:${TABLES.projetos}(count)`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar clientes:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Transform data to match expected format
    const transformedClientes = clientes?.map((cliente) => ({
      ...cliente,
      agencia: cliente.agencias,
      _count: {
        projetos: cliente.projetos?.[0]?.count || 0,
      },
    }))

    return NextResponse.json(transformedClientes)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
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

    const { data: cliente, error } = await supabaseAdmin
      .from(TABLES.clientes)
      .insert({
        nome: data.nome,
        agencia_id: data.agencia_id || null,
        contato: data.contato || null,
        cnpj: data.cnpj || null,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
        tipo_cobranca: data.tipo_cobranca || 'td',
        ativo: true,
      })
      .select(`*, agencias:${TABLES.agencias}(*)`)
      .single()

    if (error) {
      console.error('Erro ao criar cliente:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Transform data to match expected format
    const transformedCliente = {
      ...cliente,
      agencia: cliente.agencias,
    }

    revalidatePath('/', 'layout')
    return NextResponse.json(transformedCliente)
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
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

    const { data: cliente, error } = await supabaseAdmin
      .from(TABLES.clientes)
      .update({
        nome: data.nome,
        agencia_id: data.agencia_id || null,
        contato: data.contato || null,
        cnpj: data.cnpj || null,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
        tipo_cobranca: data.tipo_cobranca || 'td',
      })
      .eq('id', parseInt(id))
      .select(`*, agencias:${TABLES.agencias}(*)`)
      .single()

    if (error) {
      console.error('Erro ao atualizar cliente:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Transform data to match expected format
    const transformedCliente = {
      ...cliente,
      agencia: cliente.agencias,
    }

    revalidatePath('/', 'layout')
    return NextResponse.json(transformedCliente)
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
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
    const force = searchParams.get('force') === 'true'

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    const clienteId = parseInt(id)

    // Check for linked PIs
    const { data: linkedPIs } = await supabaseAdmin
      .from(TABLES.pis)
      .select('id, identificador')
      .eq('cliente_id', clienteId)

    // Check for linked Projetos
    const { data: linkedProjetos } = await supabaseAdmin
      .from(TABLES.projetos)
      .select('id, nome')
      .eq('cliente_id', clienteId)

    const hasLinks = (linkedPIs?.length || 0) > 0 || (linkedProjetos?.length || 0) > 0

    // If there are links and force is not true, return warning
    if (hasLinks && !force) {
      return NextResponse.json({
        error: 'Cliente possui vínculos',
        hasLinks: true,
        linkedPIs: linkedPIs || [],
        linkedProjetos: linkedProjetos || [],
        message: `Este cliente está vinculado a ${linkedPIs?.length || 0} PI(s) e ${linkedProjetos?.length || 0} projeto(s). Deseja excluir mesmo assim?`
      }, { status: 409 })
    }

    // If force=true, delete linked data first
    if (force && hasLinks) {
      // Delete estrategias linked to projetos
      if (linkedProjetos && linkedProjetos.length > 0) {
        const projetoIds = linkedProjetos.map(p => p.id)
        await supabaseAdmin
          .from(TABLES.estrategias)
          .delete()
          .in('projeto_id', projetoIds)

        // Delete projetos
        await supabaseAdmin
          .from(TABLES.projetos)
          .delete()
          .eq('cliente_id', clienteId)
      }

      // Delete PIs
      if (linkedPIs && linkedPIs.length > 0) {
        await supabaseAdmin
          .from(TABLES.pis)
          .delete()
          .eq('cliente_id', clienteId)
      }
    }

    // Delete the client
    const { error } = await supabaseAdmin
      .from(TABLES.clientes)
      .delete()
      .eq('id', clienteId)

    if (error) {
      console.error('Erro ao excluir cliente:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    revalidatePath('/', 'layout')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
