import { Resend } from 'resend'

// Lazy initialization to avoid throwing at module load when API key is missing
let resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

// Define the sender email address (must be verified in Resend)
const SENDER_EMAIL = 'dados@capdigital.company' // Production email

export async function sendTaskCreatedEmail(
    to: string,
    taskTitle: string,
    projectName: string,
    traderName: string,
    area: string,
    dueDate?: string,
    taskId?: number
) {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY is not set. Skipping email.')
            return
        }

        // Mapear área para nome amigável
        const areaLabels: Record<string, string> = {
            'relatorios': 'Relatórios',
            'faturamento': 'Faturamento',
            'dashboards': 'Dashboards',
            'gtm': 'GTM',
            'sites-lp': 'Sites/LP',
            'gestao-trafego': 'Gestão de Tráfego',
            'gestao-projetos': 'Gestão de Projetos',
            'tarefas': 'Tarefas',
            'projetos-concluidos': 'Projetos Concluídos'
        }

        const areaLabel = areaLabels[area] || area

        // Formatar data de vencimento
        let dueDateText = ''
        if (dueDate) {
            const date = new Date(dueDate + 'T00:00:00')
            dueDateText = ` para o dia ${date.toLocaleDateString('pt-BR')}`
        }

        // Construir link da task
        const baseUrl = process.env.NEXTAUTH_URL || 'https://capmanager.capdigital.company'
        const taskLink = `${baseUrl}/${area}`

        const { data, error } = await getResend()!.emails.send({
            from: SENDER_EMAIL,
            to: [to],
            subject: `Nova Tarefa: ${taskTitle}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0099ff 0%, #0066cc 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">CAP Manager</h1>
          </div>
          <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; font-size: 16px;">Olá <strong>${traderName}</strong>,</p>
            <p style="color: #111827; font-size: 16px; line-height: 1.6;">
              Uma task em <strong>${areaLabel}</strong> foi criada para você${dueDateText}.
              Acesse o Cap Manager para verificar.
            </p>
            <div style="background: white; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0099ff;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Título:</p>
              <p style="color: #111827; font-size: 16px; margin: 0; font-weight: 600;">${taskTitle}</p>
            </div>
            <a href="${taskLink}" style="display: inline-block; background-color: #0099ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; font-weight: 600;">Acessar CAP Manager</a>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">Esta é uma notificação automática do CAP Manager. Não responda a este email.</p>
          </div>
        </div>
      `,
        })

        if (error) {
            console.error('Erro ao enviar email de criação de tarefa:', error)
            return null
        }

        return data
    } catch (err) {
        console.error('Erro inesperado ao enviar email:', err)
        return null
    }
}

export async function sendTaskUpdatedEmail(
    to: string,
    taskTitle: string,
    newStatus: string,
    traderName: string
) {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY is not set. Skipping email.')
            return
        }

        // Format status for display
        const statusLabels: Record<string, string> = {
            backlog: 'Backlog',
            todo: 'Para Fazer',
            doing: 'Em Execução',
            review: 'Em Revisão',
            done: 'Finalizado',
            relatorio_a_fazer: 'A Fazer',
            relatorio_em_revisao: 'Em Revisão',
            relatorio_finalizado: 'Finalizado'
        }

        const statusDisplay = statusLabels[newStatus] || newStatus

        const { data, error } = await getResend()!.emails.send({
            from: SENDER_EMAIL,
            to: [to],
            subject: `Status Atualizado: ${taskTitle}`,
            html: `
        <h1>Status Atualizado</h1>
        <p>Olá <strong>${traderName}</strong>,</p>
        <p>A tarefa <strong>${taskTitle}</strong> teve seu status atualizado para:</p>
        <h2>${statusDisplay}</h2>
        <p>Acesse o CAP Manager para ver mais detalhes.</p>
      `,
        })

        if (error) {
            console.error('Erro ao enviar email de atualização de tarefa:', error)
            return null
        }

        return data
    } catch (err) {
        console.error('Erro inesperado ao enviar email:', err)
        return null
    }
}

// Função genérica para enviar notificações por email
export async function sendNotificationEmail(
    to: string,
    userName: string,
    title: string,
    message: string,
    actionLink?: string
) {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY is not set. Skipping email.')
            return null
        }

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const actionButton = actionLink
            ? `<a href="${baseUrl}${actionLink}" style="display: inline-block; background-color: #0099ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Ver detalhes</a>`
            : ''

        const { data, error } = await getResend()!.emails.send({
            from: SENDER_EMAIL,
            to: [to],
            subject: `CAP Manager: ${title}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0099ff 0%, #0066cc 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">CAP Manager</h1>
          </div>
          <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; font-size: 16px;">Olá <strong>${userName}</strong>,</p>
            <h2 style="color: #111827; font-size: 18px; margin: 16px 0;">${title}</h2>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">${message}</p>
            ${actionButton}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">Esta é uma notificação automática do CAP Manager. Não responda a este email.</p>
          </div>
        </div>
      `,
        })

        if (error) {
            console.error('Erro ao enviar email de notificação:', error)
            return null
        }

        return data
    } catch (err) {
        console.error('Erro inesperado ao enviar email:', err)
        return null
    }
}

