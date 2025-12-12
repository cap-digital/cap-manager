// Integração com API de WhatsApp (Evolution API, Z-API ou similar)

interface WhatsAppMessage {
  to: string
  message: string
}

interface WhatsAppResponse {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendWhatsAppMessage(
  data: WhatsAppMessage
): Promise<WhatsAppResponse> {
  const apiUrl = process.env.WHATSAPP_API_URL
  const apiKey = process.env.WHATSAPP_API_KEY
  const instance = process.env.WHATSAPP_INSTANCE

  if (!apiUrl || !apiKey || !instance) {
    console.warn('WhatsApp API não configurada')
    return { success: false, error: 'API não configurada' }
  }

  try {
    // Formatar número (remover caracteres especiais e adicionar código do país)
    const phone = formatPhoneForWhatsApp(data.to)

    const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: phone,
        textMessage: {
          text: data.message,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    return {
      success: true,
      messageId: result.key?.id,
    }
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

function formatPhoneForWhatsApp(phone: string): string {
  // Remove todos os caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '')

  // Se começar com 0, remove
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }

  // Se não tiver código do país, adiciona 55 (Brasil)
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned
  }

  return cleaned
}

// Templates de mensagens
export const messageTemplates = {
  cobranca: (clienteNome: string, valor: string, diaVencimento: number) => `
Olá! 👋

Este é um lembrete amigável sobre a cobrança do cliente *${clienteNome}*.

💰 Valor: ${valor}
📅 Dia de vencimento: ${diaVencimento}

Por favor, verifique se o pagamento foi processado.

_CAP Manager_
  `.trim(),

  campanhaAtiva: (campanhaNome: string, clienteNome: string) => `
🚀 *Nova campanha ativada!*

Campanha: *${campanhaNome}*
Cliente: ${clienteNome}

A campanha está agora ativa e rodando.

_CAP Manager_
  `.trim(),

  tarefaAtribuida: (tarefaTitulo: string, dataVencimento?: string) => `
📋 *Nova tarefa atribuída*

Tarefa: *${tarefaTitulo}*
${dataVencimento ? `📅 Vencimento: ${dataVencimento}` : ''}

Acesse o CAP Manager para mais detalhes.

_CAP Manager_
  `.trim(),

  tarefaVencendo: (tarefaTitulo: string, dataVencimento: string) => `
⚠️ *Tarefa vencendo!*

A tarefa *${tarefaTitulo}* vence em *${dataVencimento}*.

Por favor, verifique o status.

_CAP Manager_
  `.trim(),

  alertaPersonalizado: (titulo: string, mensagem: string) => `
🔔 *${titulo}*

${mensagem}

_CAP Manager_
  `.trim(),
}

// Função para enviar alerta de cobrança
export async function sendBillingAlert(params: {
  phone: string
  clienteNome: string
  valor: string
  diaVencimento: number
}): Promise<WhatsAppResponse> {
  const message = messageTemplates.cobranca(
    params.clienteNome,
    params.valor,
    params.diaVencimento
  )

  return sendWhatsAppMessage({
    to: params.phone,
    message,
  })
}

// Função para enviar alerta de tarefa
export async function sendTaskAlert(params: {
  phone: string
  tarefaTitulo: string
  dataVencimento?: string
}): Promise<WhatsAppResponse> {
  const message = messageTemplates.tarefaAtribuida(
    params.tarefaTitulo,
    params.dataVencimento
  )

  return sendWhatsAppMessage({
    to: params.phone,
    message,
  })
}

// Função para enviar alerta de campanha
export async function sendCampaignAlert(params: {
  phone: string
  campanhaNome: string
  clienteNome: string
}): Promise<WhatsAppResponse> {
  const message = messageTemplates.campanhaAtiva(
    params.campanhaNome,
    params.clienteNome
  )

  return sendWhatsAppMessage({
    to: params.phone,
    message,
  })
}
