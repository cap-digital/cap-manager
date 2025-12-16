import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

// Endpoint para verificar e enviar lembretes de cobrança diários
export async function GET() {
  try {
    const today = new Date()
    const diaHoje = today.getDate()

    // Buscar clientes com cobrança para hoje
    const clientes = await prisma.cliente.findMany({
      where: {
        diaCobranca: diaHoje,
        ativo: true,
        whatsapp: { not: null },
      },
    })

    const results = []

    for (const cliente of clientes) {
      if (cliente.whatsapp) {
        const message = messageTemplates.cobranca(
          cliente.nome,
          'Valor a confirmar',
          cliente.diaCobranca || 0
        )

        const result = await sendWhatsAppMessage({
          to: cliente.whatsapp,
          message,
        })

        // Registrar alerta no banco
        await prisma.alerta.create({
          data: {
            tipo: 'cobranca',
            titulo: `Cobrança - ${cliente.nome}`,
            mensagem: message,
            destinatarioId: cliente.id,
            enviadoWhatsapp: result.success,
            dataEnvioWhatsapp: result.success ? new Date() : null,
          },
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
  const cliente = await prisma.cliente.findUnique({
    where: { id: data.cliente_id },
  })

  if (!cliente || !cliente.whatsapp) {
    return NextResponse.json({ error: 'Cliente não encontrado ou sem WhatsApp' }, { status: 404 })
  }

  const message = messageTemplates.cobranca(
    cliente.nome,
    data.valor || 'Valor a confirmar',
    cliente.diaCobranca || 0
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
  const [tarefa, responsavel] = await Promise.all([
    prisma.tarefa.findUnique({ where: { id: data.tarefa_id } }),
    prisma.usuario.findUnique({ where: { id: data.responsavel_id } }),
  ])

  if (!tarefa || !responsavel || !responsavel.whatsapp) {
    return NextResponse.json({ error: 'Dados não encontrados' }, { status: 404 })
  }

  const message = messageTemplates.tarefaAtribuida(
    tarefa.titulo,
    tarefa.dataVencimento
      ? tarefa.dataVencimento.toLocaleDateString('pt-BR')
      : undefined
  )

  const result = await sendWhatsAppMessage({
    to: responsavel.whatsapp,
    message,
  })

  // Registrar alerta
  await prisma.alerta.create({
    data: {
      tipo: 'tarefa',
      titulo: `Tarefa atribuída: ${tarefa.titulo}`,
      mensagem: message,
      destinatarioId: responsavel.id,
      enviadoWhatsapp: result.success,
      dataEnvioWhatsapp: result.success ? new Date() : null,
    },
  })

  return NextResponse.json(result)
}

async function handleProjectActivated(data: { projeto_id: string }) {
  const projeto = await prisma.projeto.findUnique({
    where: { id: data.projeto_id },
    include: {
      cliente: true,
      trader: true,
    },
  })

  if (!projeto) {
    return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
  }

  const results = []

  // Notificar trader
  if (projeto.trader?.whatsapp) {
    const message = messageTemplates.campanhaAtiva(
      projeto.nome,
      projeto.cliente?.nome || 'Cliente'
    )

    const result = await sendWhatsAppMessage({
      to: projeto.trader.whatsapp,
      message,
    })

    results.push({ trader: projeto.trader.nome, ...result })
  }

  return NextResponse.json({ results })
}

async function handleCustomAlert(data: {
  destinatario_id: string
  titulo: string
  mensagem: string
}) {
  const destinatario = await prisma.usuario.findUnique({
    where: { id: data.destinatario_id },
  })

  if (!destinatario || !destinatario.whatsapp) {
    return NextResponse.json({ error: 'Destinatário não encontrado' }, { status: 404 })
  }

  const message = messageTemplates.alertaPersonalizado(data.titulo, data.mensagem)

  const result = await sendWhatsAppMessage({
    to: destinatario.whatsapp,
    message,
  })

  // Registrar alerta
  await prisma.alerta.create({
    data: {
      tipo: 'sistema',
      titulo: data.titulo,
      mensagem: data.mensagem,
      destinatarioId: destinatario.id,
      enviadoWhatsapp: result.success,
      dataEnvioWhatsapp: result.success ? new Date() : null,
    },
  })

  return NextResponse.json(result)
}
