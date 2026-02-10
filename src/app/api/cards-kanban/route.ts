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

    // Criar notificação e enviar email
    if (card.trader_id) {
      const { data: trader } = await supabaseAdmin
        .from(TABLES.usuarios)
        .select('name:nome, email, email_notificacoes')
        .eq('id', card.trader_id)
        .single()

      if (trader) {
        let projectName = 'Geral'
        if (card.projeto_id) {
          const { data: proj } = await supabaseAdmin.from(TABLES.projetos).select('nome').eq('id', card.projeto_id).single()
          if (proj) projectName = proj.nome
        }

        const tituloNotificacao = `Nova Tarefa: ${card.titulo}`
        const mensagemNotificacao = `Uma nova tarefa foi atribuída a você no projeto ${projectName}.`
        const emailPara = trader.email_notificacoes || trader.email

        // Criar alerta no banco
        await supabaseAdmin.from(TABLES.alertas).insert({
          tipo: 'tarefa',
          titulo: tituloNotificacao,
          mensagem: mensagemNotificacao,
          destinatario_id: card.trader_id,
          lido: false,
          enviado_whatsapp: false
        })

        // Enviar email
        if (emailPara) {
          // Utilizando a função existente ou a nova genérica se preferir, mas mantendo o padrão do arquivo de mail importado
          // Como o usuário pediu para tudo ir pro email, vamos garantir o envio
          try {
            // Import sendNotificationEmail from '@/lib/mail' if needed or use existing. 
            // Existing sendTaskCreatedEmail is specific, let's keep it but make sure it works fine.
            // Actually, the user wants UNIFIED generic notification style likely.
            // Let's use the legacy function for now but ensure it sends to the correct email.
            await sendTaskCreatedEmail(emailPara, card.titulo, projectName, trader.name)
          } catch (e) {
            console.error('Erro ao enviar email:', e)
          }
        }
      }
    }

    return NextResponse.json(card)
  } catch (error: any) {
    console.error('Erro ao criar card:', error)
    return NextResponse.json({
      error: error.message || 'Erro interno não tratado',
      stack: error.stack
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

    // Se houve mudança de status e existe um responsável, notificar
    if (data.status !== undefined && card.trader_id) {
      const { data: trader } = await supabaseAdmin
        .from(TABLES.usuarios)
        .select('name:nome, email, email_notificacoes')
        .eq('id', card.trader_id)
        .single()

      if (trader) {
        const tituloNotificacao = `Status Atualizado: ${card.titulo}`
        const mensagemNotificacao = `O status da tarefa foi atualizado para: ${card.status}`
        const emailPara = trader.email_notificacoes || trader.email

        // Criar alerta
        await supabaseAdmin.from(TABLES.alertas).insert({
          tipo: 'tarefa',
          titulo: tituloNotificacao,
          mensagem: mensagemNotificacao,
          destinatario_id: card.trader_id,
          lido: false,
          enviado_whatsapp: false
        })

        // Enviar email
        if (emailPara) {
          try {
            await sendTaskUpdatedEmail(emailPara, card.titulo, card.status, trader.name)
          } catch (e) { console.error(e) }
        }
      }
    }

    // Se houve mudança de reponsável, notificar o novo responsável
    if (data.trader_id !== undefined && data.trader_id !== card.trader_id) {
      // Lógica para notificar novo responsável (similar ao create)
      const { data: trader } = await supabaseAdmin
        .from(TABLES.usuarios)
        .select('name:nome, email, email_notificacoes')
        .eq('id', data.trader_id)
        .single()

      if (trader) {
        // Buscar nome projeto
        let projectName = 'Geral'
        if (card.projeto_id) {
          const { data: proj } = await supabaseAdmin.from(TABLES.projetos).select('nome').eq('id', card.projeto_id).single()
          if (proj) projectName = proj.nome
        }

        const tituloNotificacao = `Nova Tarefa Atribuída: ${card.titulo}`
        const mensagemNotificacao = `Você foi definido como responsável por esta tarefa.`
        const emailPara = trader.email_notificacoes || trader.email

        await supabaseAdmin.from(TABLES.alertas).insert({
          tipo: 'tarefa',
          titulo: tituloNotificacao,
          mensagem: mensagemNotificacao,
          destinatario_id: data.trader_id,
          lido: false,
          enviado_whatsapp: false
        })

        if (emailPara) {
          try {
            await sendTaskCreatedEmail(emailPara, card.titulo, projectName, trader.name)
          } catch (e) { console.error(e) }
        }
      }
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
