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

    const { data: agencias, error } = await supabaseAdmin
      .from(TABLES.agencias)
      .select(`*, clientes:${TABLES.clientes}(count)`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar agências:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Formatar os dados para corresponder à estrutura anterior
    const formattedAgencias = agencias?.map((agencia) => ({
      ...agencia,
      _count: {
        clientes: agencia.clientes?.[0]?.count || 0,
      },
    }))

    return NextResponse.json(formattedAgencias)
  } catch (error) {
    console.error('Erro ao buscar agências:', error)
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

    const { data: agencia, error } = await supabaseAdmin
      .from(TABLES.agencias)
      .insert({
        nome: data.nome,
        cnpj: data.cnpj || null,
        telefone: data.telefone || null,
        email: data.email || null,
        contato: data.contato || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar agência:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    revalidatePath('/', 'layout')
    return NextResponse.json(agencia)
  } catch (error) {
    console.error('Erro ao criar agência:', error)
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

    const { data: agencia, error } = await supabaseAdmin
      .from(TABLES.agencias)
      .update({
        nome: data.nome,
        cnpj: data.cnpj || null,
        telefone: data.telefone || null,
        email: data.email || null,
        contato: data.contato || null,
      })
      .eq('id', parseInt(id))
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar agência:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    revalidatePath('/', 'layout')
    return NextResponse.json(agencia)
  } catch (error) {
    console.error('Erro ao atualizar agência:', error)
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

    const agenciaId = parseInt(id)

    // Check for linked clientes
    const { data: linkedClientes } = await supabaseAdmin
      .from(TABLES.clientes)
      .select('id, nome')
      .eq('agencia_id', agenciaId)

    // Check for linked PIs
    const { data: linkedPIs } = await supabaseAdmin
      .from(TABLES.pis)
      .select('id, identificador')
      .eq('agencia_id', agenciaId)

    // Check for linked Projetos
    const { data: linkedProjetos } = await supabaseAdmin
      .from(TABLES.projetos)
      .select('id, nome')
      .eq('agencia_id', agenciaId)

    const hasLinks = (linkedClientes?.length || 0) > 0 || (linkedPIs?.length || 0) > 0 || (linkedProjetos?.length || 0) > 0

    // If there are links and force is not true, return warning
    if (hasLinks && !force) {
      return NextResponse.json({
        error: 'Agência possui vínculos',
        hasLinks: true,
        linkedClientes: linkedClientes || [],
        linkedPIs: linkedPIs || [],
        linkedProjetos: linkedProjetos || [],
        message: `Esta agência está vinculada a ${linkedClientes?.length || 0} cliente(s), ${linkedPIs?.length || 0} PI(s) e ${linkedProjetos?.length || 0} projeto(s). Deseja excluir mesmo assim?`
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
      }

      // Delete projetos
      await supabaseAdmin
        .from(TABLES.projetos)
        .delete()
        .eq('agencia_id', agenciaId)

      // Delete PIs
      await supabaseAdmin
        .from(TABLES.pis)
        .delete()
        .eq('agencia_id', agenciaId)

      // Update clientes to remove agencia_id (don't delete clients, just unlink)
      await supabaseAdmin
        .from(TABLES.clientes)
        .update({ agencia_id: null })
        .eq('agencia_id', agenciaId)
    }

    const { error } = await supabaseAdmin
      .from(TABLES.agencias)
      .delete()
      .eq('id', agenciaId)

    if (error) {
      console.error('Erro ao excluir agência:', error)
      return NextResponse.json({ error: 'Erro ao excluir agência' }, { status: 500 })
    }

    revalidatePath('/', 'layout')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir agência:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
