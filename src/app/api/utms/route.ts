import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: utms, error } = await supabaseAdmin
      .from(TABLES.utm_configs)
      .select(`*, projetos:${TABLES.projetos}(*)`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar UTMs:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json(utms)
  } catch (error) {
    console.error('Erro ao buscar UTMs:', error)
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

    const { data: utm, error } = await supabaseAdmin
      .from(TABLES.utm_configs)
      .insert({
        projeto_id: data.projeto_id || null,
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        utm_term: data.utm_term || null,
        utm_content: data.utm_content || null,
        url_destino: data.url_destino,
        url_gerada: data.url_gerada,
      })
      .select(`*, projetos:${TABLES.projetos}(*)`)
      .single()

    if (error) {
      console.error('Erro ao criar UTM:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json(utm)
  } catch (error) {
    console.error('Erro ao criar UTM:', error)
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
      .from(TABLES.utm_configs)
      .delete()
      .eq('id', Number(id))

    if (error) {
      console.error('Erro ao deletar UTM:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar UTM:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
