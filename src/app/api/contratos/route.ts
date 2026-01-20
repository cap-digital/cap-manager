import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const clienteId = searchParams.get('cliente_id')

        let query = supabaseAdmin
            .from(TABLES.contratos)
            .select(`
        *,
        cliente:cap_manager_clientes (id, nome)
      `)
            .order('data_inicio', { ascending: false })

        if (clienteId) {
            query = query.eq('cliente_id', parseInt(clienteId))
        }

        const { data: contratos, error } = await query

        if (error) {
            console.error('Erro ao buscar contratos:', error)
            return NextResponse.json({ error: 'Erro ao buscar contratos' }, { status: 500 })
        }

        return NextResponse.json(contratos)
    } catch (error) {
        console.error('Erro ao buscar contratos:', error)
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

        // Validações básicas
        if (!data.cliente_id || !data.data_inicio || !data.valor) {
            return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
        }

        const insertData = {
            cliente_id: parseInt(data.cliente_id),
            recorrente: !!data.recorrente,
            data_inicio: data.data_inicio, // YYYY-MM-DD
            data_fim: data.data_fim || null,
            valor: parseFloat(data.valor),
            observacao: data.observacao || null,
            ativo: true
        }

        const { data: contrato, error } = await supabaseAdmin
            .from(TABLES.contratos)
            .insert(insertData)
            .select(`
        *,
        cliente:cap_manager_clientes (id, nome)
      `)
            .single()

        if (error) {
            console.error('Erro ao criar contrato:', error)
            return NextResponse.json({ error: 'Erro ao criar contrato', details: error.message }, { status: 500 })
        }

        return NextResponse.json(contrato)
    } catch (error: any) {
        console.error('Erro ao criar contrato:', error)
        return NextResponse.json({ error: 'Erro interno', details: error.message }, { status: 500 })
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

        const updateData: any = {}
        if (data.cliente_id) updateData.cliente_id = parseInt(data.cliente_id)
        if (data.recorrente !== undefined) updateData.recorrente = !!data.recorrente
        if (data.data_inicio) updateData.data_inicio = data.data_inicio
        if (data.data_fim !== undefined) updateData.data_fim = data.data_fim
        if (data.valor) updateData.valor = parseFloat(data.valor)
        if (data.observacao !== undefined) updateData.observacao = data.observacao
        if (data.ativo !== undefined) updateData.ativo = !!data.ativo

        updateData.updated_at = new Date().toISOString()

        const { data: contrato, error } = await supabaseAdmin
            .from(TABLES.contratos)
            .update(updateData)
            .eq('id', parseInt(id))
            .select(`
        *,
        cliente:cap_manager_clientes (id, nome)
      `)
            .single()

        if (error) {
            console.error('Erro ao atualizar contrato:', error)
            return NextResponse.json({ error: 'Erro ao atualizar contrato' }, { status: 500 })
        }

        return NextResponse.json(contrato)
    } catch (error) {
        console.error('Erro ao atualizar contrato:', error)
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

        if (!id) {
            return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from(TABLES.contratos)
            .delete()
            .eq('id', parseInt(id))

        if (error) {
            console.error('Erro ao excluir contrato:', error)
            return NextResponse.json({ error: 'Erro ao excluir contrato' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao excluir contrato:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
