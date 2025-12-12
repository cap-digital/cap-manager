import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsAppMessage, messageTemplates } from '@/lib/whatsapp'

// Função para criar cliente Supabase com service role
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case 'billing_reminder':
        return await handleBillingReminder(data)
      case 'task_assigned':
        return await handleTaskAssigned(data)
      case 'campaign_activated':
        return await handleCampaignActivated(data)
      case 'custom_alert':
        return await handleCustomAlert(data)
      default:
        return NextResponse.json({ error: 'Tipo de alerta inválido' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro no webhook WhatsApp:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Endpoint para verificar e enviar lembretes de cobrança diários
export async function GET() {
  try {
    const supabase = getSupabase()
    const today = new Date()
    const diaHoje = today.getDate()

    // Buscar clientes com cobrança para hoje
    const { data: clientes, error } = await supabase
      .from('cap_manager_clientes')
      .select('*')
      .eq('dia_cobranca', diaHoje)
      .eq('ativo', true)
      .not('whatsapp', 'is', null)

    if (error) throw error

    const results = []

    for (const cliente of clientes || []) {
      if (cliente.whatsapp) {
        const message = messageTemplates.cobranca(
          cliente.nome,
          'Valor a confirmar',
          cliente.dia_cobranca
        )

        const result = await sendWhatsAppMessage({
          to: cliente.whatsapp,
          message,
        })

        // Registrar alerta no banco
        await supabase.from('cap_manager_alertas').insert({
          tipo: 'cobranca',
          titulo: `Cobrança - ${cliente.nome}`,
          mensagem: message,
          destinatario_id: cliente.id,
          enviado_whatsapp: result.success,
          data_envio_whatsapp: result.success ? new Date().toISOString() : null,
        })

        results.push({
          cliente: cliente.nome,
          success: result.success,
          error: result.error,
        })
      }
    }

    return NextResponse.json({
      message: `${results.length} lembretes processados`,
      results,
    })
  } catch (error) {
    console.error('Erro ao processar lembretes:', error)
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 })
  }
}

async function handleBillingReminder(data: {
  cliente_id: string
  valor?: string
}) {
  const supabase = getSupabase()
  const { data: cliente } = await supabase
    .from('cap_manager_clientes')
    .select('*')
    .eq('id', data.cliente_id)
    .single()

  if (!cliente || !cliente.whatsapp) {
    return NextResponse.json({ error: 'Cliente não encontrado ou sem WhatsApp' }, { status: 404 })
  }

  const message = messageTemplates.cobranca(
    cliente.nome,
    data.valor || 'Valor a confirmar',
    cliente.dia_cobranca
  )

  const result = await sendWhatsAppMessage({
    to: cliente.whatsapp,
    message,
  })

  return NextResponse.json(result)
}

async function handleTaskAssigned(data: {
  tarefa_id: string
  responsavel_id: string
}) {
  const supabase = getSupabase()
  const [{ data: tarefa }, { data: responsavel }] = await Promise.all([
    supabase.from('cap_manager_tarefas').select('*').eq('id', data.tarefa_id).single(),
    supabase.from('cap_manager_usuarios').select('*').eq('id', data.responsavel_id).single(),
  ])

  if (!tarefa || !responsavel || !responsavel.whatsapp) {
    return NextResponse.json({ error: 'Dados não encontrados' }, { status: 404 })
  }

  const message = messageTemplates.tarefaAtribuida(
    tarefa.titulo,
    tarefa.data_vencimento
      ? new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')
      : undefined
  )

  const result = await sendWhatsAppMessage({
    to: responsavel.whatsapp,
    message,
  })

  // Registrar alerta
  await supabase.from('cap_manager_alertas').insert({
    tipo: 'tarefa',
    titulo: `Tarefa atribuída: ${tarefa.titulo}`,
    mensagem: message,
    destinatario_id: responsavel.id,
    enviado_whatsapp: result.success,
    data_envio_whatsapp: result.success ? new Date().toISOString() : null,
  })

  return NextResponse.json(result)
}

async function handleCampaignActivated(data: { campanha_id: string }) {
  const supabase = getSupabase()
  const { data: campanha } = await supabase
    .from('cap_manager_campanhas')
    .select('*, cliente:cap_manager_clientes(*), trader:cap_manager_usuarios(*)')
    .eq('id', data.campanha_id)
    .single()

  if (!campanha) {
    return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  }

  const results = []

  // Notificar trader
  if (campanha.trader?.whatsapp) {
    const message = messageTemplates.campanhaAtiva(
      campanha.nome,
      campanha.cliente?.nome || 'Cliente'
    )

    const result = await sendWhatsAppMessage({
      to: campanha.trader.whatsapp,
      message,
    })

    results.push({ trader: campanha.trader.nome, ...result })
  }

  return NextResponse.json({ results })
}

async function handleCustomAlert(data: {
  destinatario_id: string
  titulo: string
  mensagem: string
}) {
  const supabase = getSupabase()
  const { data: destinatario } = await supabase
    .from('cap_manager_usuarios')
    .select('*')
    .eq('id', data.destinatario_id)
    .single()

  if (!destinatario || !destinatario.whatsapp) {
    return NextResponse.json({ error: 'Destinatário não encontrado' }, { status: 404 })
  }

  const message = messageTemplates.alertaPersonalizado(data.titulo, data.mensagem)

  const result = await sendWhatsAppMessage({
    to: destinatario.whatsapp,
    message,
  })

  // Registrar alerta
  await supabase.from('cap_manager_alertas').insert({
    tipo: 'sistema',
    titulo: data.titulo,
    mensagem: data.mensagem,
    destinatario_id: destinatario.id,
    enviado_whatsapp: result.success,
    data_envio_whatsapp: result.success ? new Date().toISOString() : null,
  })

  return NextResponse.json(result)
}
