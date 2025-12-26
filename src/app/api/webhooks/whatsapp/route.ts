import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendWhatsAppMessage, messageTemplates } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case 'billing_reminder':
        return await handleBillingReminder(data)
      case 'task_assigned':
        return await handleTaskAssigned(data)
      case 'project_activated':
        return await handleProjectActivated(data)
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

// Endpoint para verificar status
export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp webhook ativo',
    timestamp: new Date().toISOString(),
  })
}

async function handleBillingReminder(data: {
  cliente_id: number
  valor?: string
}) {
  const { data: cliente, error } = await supabaseAdmin
    .from('clientes')
    .select('*')
    .eq('id', data.cliente_id)
    .single()

  if (error || !cliente || !cliente.whatsapp) {
    return NextResponse.json({ error: 'Cliente não encontrado ou sem WhatsApp' }, { status: 404 })
  }

  const message = messageTemplates.cobranca(
    cliente.nome,
    data.valor || 'Valor a confirmar',
    0
  )

  const result = await sendWhatsAppMessage({
    to: cliente.whatsapp,
    message,
  })

  return NextResponse.json(result)
}

async function handleTaskAssigned(data: {
  tarefa_id: number
  responsavel_id: number
}) {
  const [tarefaRes, responsavelRes] = await Promise.all([
    supabaseAdmin.from('tarefas').select('*').eq('id', data.tarefa_id).single(),
    supabaseAdmin.from('usuarios').select('*').eq('id', data.responsavel_id).single(),
  ])

  const tarefa = tarefaRes.data
  const responsavel = responsavelRes.data

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
  await supabaseAdmin.from('alertas').insert({
    tipo: 'tarefa',
    titulo: `Tarefa atribuída: ${tarefa.titulo}`,
    mensagem: message,
    destinatario_id: responsavel.id,
    enviado_whatsapp: result.success,
    data_envio_whatsapp: result.success ? new Date().toISOString() : null,
  })

  return NextResponse.json(result)
}

async function handleProjectActivated(data: { projeto_id: number }) {
  const { data: projeto, error } = await supabaseAdmin
    .from('projetos')
    .select(`
      *,
      clientes:cliente_id(id, nome),
      trader:usuarios!projetos_trader_id_fkey(id, nome, whatsapp)
    `)
    .eq('id', data.projeto_id)
    .single()

  if (error || !projeto) {
    return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
  }

  const results = []
  const trader = Array.isArray(projeto.trader) ? projeto.trader[0] : projeto.trader
  const cliente = Array.isArray(projeto.clientes) ? projeto.clientes[0] : projeto.clientes

  // Notificar trader
  if (trader?.whatsapp) {
    const message = messageTemplates.campanhaAtiva(
      projeto.nome,
      cliente?.nome || 'Cliente'
    )

    const result = await sendWhatsAppMessage({
      to: trader.whatsapp,
      message,
    })

    results.push({ trader: trader.nome, ...result })
  }

  return NextResponse.json({ results })
}

async function handleCustomAlert(data: {
  destinatario_id: number
  titulo: string
  mensagem: string
}) {
  const { data: destinatario, error } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .eq('id', data.destinatario_id)
    .single()

  if (error || !destinatario || !destinatario.whatsapp) {
    return NextResponse.json({ error: 'Destinatário não encontrado' }, { status: 404 })
  }

  const message = messageTemplates.alertaPersonalizado(data.titulo, data.mensagem)

  const result = await sendWhatsAppMessage({
    to: destinatario.whatsapp,
    message,
  })

  // Registrar alerta
  await supabaseAdmin.from('alertas').insert({
    tipo: 'sistema',
    titulo: data.titulo,
    mensagem: data.mensagem,
    destinatario_id: destinatario.id,
    enviado_whatsapp: result.success,
    data_envio_whatsapp: result.success ? new Date().toISOString() : null,
  })

  return NextResponse.json(result)
}
