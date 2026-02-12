import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin, TABLES } from '@/lib/supabase'
import { sendTaskCreatedEmail, sendTaskUpdatedEmail } from '@/lib/mail'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const area = searchParams.get('area')

    if (!area) {
      return NextResponse.json({ error: 'Area nao informada' }, { status: 400 })
    }

    const { data: cards, error } = await supabaseAdmin
      .from(TABLES.cards_kanban)
      .select('*')
      .eq('area', area)
      .order('ordem', { ascending: true })

    if (error) {
      console.error('Erro ao buscar cards:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json(cards)
  } catch (error) {
    console.error('Erro ao buscar cards:', error)
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

    // Get max ordem for this area and status
    const { data: maxOrdemData, error: maxOrdemError } = await supabaseAdmin
      .from(TABLES.cards_kanban)
      .select('ordem')
      .eq('area', data.area)
      .eq('status', data.status || 'backlog')
      .order('ordem', { ascending: false })
      .limit(1)

    const maxOrdem = maxOrdemData && maxOrdemData.length > 0 ? maxOrdemData[0].ordem : 0

    const { data: card, error } = await supabaseAdmin
      .from(TABLES.cards_kanban)
      .insert({
        titulo: data.titulo,
        descricao: data.descricao || null,
        area: data.area,
        status: data.status || 'backlog',
        prioridade: data.prioridade || 'media',
        cliente_id: data.cliente_id || null,
        projeto_id: data.projeto_id || null,
        trader_id: data.trader_id || null,
        responsavel_relatorio_id: data.responsavel_relatorio_id || null,
        responsavel_revisao_id: data.responsavel_revisao_id || null,
        revisao_relatorio_ok: data.revisao_relatorio_ok || false,
        link_relatorio: data.link_relatorio || null,
        faturamento_card_id: data.faturamento_card_id || null,
        data_vencimento: data.data_vencimento || null,
        data_inicio: data.data_inicio || null,
        observador_id: data.observador_id || null,
        categoria: data.categoria || null,
        ordem: maxOrdem + 1,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar card:', error)
      return NextResponse.json({
        error: error.message || 'Erro interno ao criar card',
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 })
    }

    // Notificações em background (não devem falhar a request principal)
    try {
      // Buscar nome do projeto para contexto
      let projectName = 'Geral'
      if (card.projeto_id) {
        const { data: proj } = await supabaseAdmin.from(TABLES.projetos).select('nome').eq('id', card.projeto_id).single()
        if (proj) projectName = proj.nome
      }

      // Lista de usuários para notificar (sem duplicatas)
      const usuariosParaNotificar = new Set<number>()
      if (card.trader_id) usuariosParaNotificar.add(card.trader_id)
      if (card.responsavel_relatorio_id) usuariosParaNotificar.add(card.responsavel_relatorio_id)
      if (card.responsavel_revisao_id) usuariosParaNotificar.add(card.responsavel_revisao_id)
      if (card.observador_id) usuariosParaNotificar.add(card.observador_id)

      // Enviar notificações para todos os responsáveis
      for (const usuarioId of Array.from(usuariosParaNotificar)) {
        const { data: usuario } = await supabaseAdmin
          .from(TABLES.usuarios)
          .select('id, nome, email')
          .eq('id', usuarioId)
          .single()

        if (usuario) {
          // Criar alerta no sistema
          await supabaseAdmin.from(TABLES.alertas).insert({
            tipo: 'tarefa',
            titulo: `Nova Tarefa: ${card.titulo}`,
            mensagem: `Uma nova tarefa foi atribuída a você no projeto ${projectName}.`,
            destinatario_id: usuario.id,
            lido: false,
            enviado_whatsapp: false
          })

          // Enviar email
          if (usuario.email) {
            console.log(`[EMAIL] Enviando para ${usuario.email}: Nova tarefa "${card.titulo}"`)
            await sendTaskCreatedEmail(
              usuario.email,
              card.titulo,
              projectName,
              usuario.nome,
              card.area,
              card.data_vencimento || undefined,
              card.id
            )
          }
        }
      }
    } catch (notifError) {
      console.error('Erro ao enviar notificações (card criado com sucesso):', notifError)
    }

    return NextResponse.json(card)
  } catch (error: any) {
    console.error('Erro ao criar card:', error)
    return NextResponse.json({
      error: error.message || 'Erro interno não tratado',
    }, { status: 500 })
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

    const updateData: any = {}

    if (data.titulo !== undefined) updateData.titulo = data.titulo
    if (data.descricao !== undefined) updateData.descricao = data.descricao
    if (data.status !== undefined) updateData.status = data.status
    if (data.prioridade !== undefined) updateData.prioridade = data.prioridade
    if (data.cliente_id !== undefined) updateData.cliente_id = data.cliente_id
    if (data.projeto_id !== undefined) updateData.projeto_id = data.projeto_id
    if (data.trader_id !== undefined) updateData.trader_id = data.trader_id
    if (data.responsavel_relatorio_id !== undefined) updateData.responsavel_relatorio_id = data.responsavel_relatorio_id
    if (data.responsavel_revisao_id !== undefined) updateData.responsavel_revisao_id = data.responsavel_revisao_id
    if (data.revisao_relatorio_ok !== undefined) updateData.revisao_relatorio_ok = data.revisao_relatorio_ok
    if (data.link_relatorio !== undefined) updateData.link_relatorio = data.link_relatorio
    if (data.data_vencimento !== undefined) updateData.data_vencimento = data.data_vencimento
    if (data.data_inicio !== undefined) updateData.data_inicio = data.data_inicio
    if (data.observador_id !== undefined) updateData.observador_id = data.observador_id
    if (data.categoria !== undefined) updateData.categoria = data.categoria
    if (data.ordem !== undefined) updateData.ordem = data.ordem

    const { data: card, error } = await supabaseAdmin
      .from(TABLES.cards_kanban)
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar card:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    // Notificações em background (não devem falhar a request principal)
    try {
      // Se houve mudança de status e existe um responsável, notificar
      if (data.status !== undefined && card.trader_id) {
        const { data: trader } = await supabaseAdmin
          .from(TABLES.usuarios)
          .select('name:nome, email')
          .eq('id', card.trader_id)
          .single()

        if (trader) {
          const tituloNotificacao = `Status Atualizado: ${card.titulo}`
          const mensagemNotificacao = `O status da tarefa foi atualizado para: ${card.status}`

          await supabaseAdmin.from(TABLES.alertas).insert({
            tipo: 'tarefa',
            titulo: tituloNotificacao,
            mensagem: mensagemNotificacao,
            destinatario_id: card.trader_id,
            lido: false,
            enviado_whatsapp: false
          })

          if (trader.email) {
            await sendTaskUpdatedEmail(trader.email, card.titulo, card.status, trader.name)
          }
        }
      }

      // Se houve mudança de responsável, notificar o novo responsável
      if (data.trader_id !== undefined && data.trader_id !== card.trader_id) {
        const { data: trader } = await supabaseAdmin
          .from(TABLES.usuarios)
          .select('name:nome, email')
          .eq('id', data.trader_id)
          .single()

        if (trader) {
          let projectName = 'Geral'
          if (card.projeto_id) {
            const { data: proj } = await supabaseAdmin.from(TABLES.projetos).select('nome').eq('id', card.projeto_id).single()
            if (proj) projectName = proj.nome
          }

          await supabaseAdmin.from(TABLES.alertas).insert({
            tipo: 'tarefa',
            titulo: `Nova Tarefa Atribuída: ${card.titulo}`,
            mensagem: `Você foi definido como responsável por esta tarefa.`,
            destinatario_id: data.trader_id,
            lido: false,
            enviado_whatsapp: false
          })

          if (trader.email) {
            await sendTaskCreatedEmail(
              trader.email,
              card.titulo,
              projectName,
              trader.name,
              card.area,
              card.data_vencimento || undefined,
              card.id
            )
          }
        }
      }
    } catch (notifError) {
      console.error('Erro ao enviar notificações (card salvo com sucesso):', notifError)
    }

    return NextResponse.json(card)
  } catch (error) {
    console.error('Erro ao atualizar card:', error)
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
      .from(TABLES.cards_kanban)
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      console.error('Erro ao excluir card:', error)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir card:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
