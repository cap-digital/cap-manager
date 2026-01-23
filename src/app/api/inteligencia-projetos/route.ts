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

        const { data: projetos, error } = await supabaseAdmin
            .from(TABLES.inteligencia_projetos)
            .select(`
                *, 
                cliente:${TABLES.clientes}(nome),
                feito_por:${TABLES.usuarios}(nome),
                revisado_por:${TABLES.usuarios}(nome)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Erro ao buscar projetos de inteligência:', error)
            return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
        }

        return NextResponse.json(projetos)
    } catch (error) {
        console.error('Erro ao buscar projetos de inteligência:', error)
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

        const { data: projeto, error } = await supabaseAdmin
            .from(TABLES.inteligencia_projetos)
            .insert({
                nome_projeto: data.nome_projeto,
                data_criacao: data.data_criacao || null,
                link_lovable: data.link_lovable || null,
                link_vercel: data.link_vercel || null,
                link_render_railway: data.link_render_railway || null,
                link_dominio: data.link_dominio || null,
                feito_por_id: data.feito_por_id || null,
                revisado_por_id: data.revisado_por_id || null,
                cliente_id: data.cliente_id || null,
            })
            .select(`
                *, 
                cliente:${TABLES.clientes}(nome),
                feito_por:${TABLES.usuarios}(nome),
                revisado_por:${TABLES.usuarios}(nome)
            `)
            .single()

        if (error) {
            console.error('Erro ao criar projeto de inteligência:', error)
            return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
        }

        revalidatePath('/', 'layout')
        return NextResponse.json(projeto)
    } catch (error) {
        console.error('Erro ao criar projeto de inteligência:', error)
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

        const { data: projeto, error } = await supabaseAdmin
            .from(TABLES.inteligencia_projetos)
            .update({
                nome_projeto: data.nome_projeto,
                data_criacao: data.data_criacao || null,
                link_lovable: data.link_lovable || null,
                link_vercel: data.link_vercel || null,
                link_render_railway: data.link_render_railway || null,
                link_dominio: data.link_dominio || null,
                feito_por_id: data.feito_por_id || null,
                revisado_por_id: data.revisado_por_id || null,
                cliente_id: data.cliente_id || null,
            })
            .eq('id', parseInt(id))
            .select(`
                *, 
                cliente:${TABLES.clientes}(nome),
                feito_por:${TABLES.usuarios}(nome),
                revisado_por:${TABLES.usuarios}(nome)
            `)
            .single()

        if (error) {
            console.error('Erro ao atualizar projeto de inteligência:', error)
            return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
        }

        revalidatePath('/', 'layout')
        return NextResponse.json(projeto)
    } catch (error) {
        console.error('Erro ao atualizar projeto de inteligência:', error)
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
            .from(TABLES.inteligencia_projetos)
            .delete()
            .eq('id', parseInt(id))

        if (error) {
            console.error('Erro ao excluir projeto de inteligência:', error)
            return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
        }

        revalidatePath('/', 'layout')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao excluir projeto de inteligência:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
