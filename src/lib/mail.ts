import { Resend } from 'resend'

// Initialize Resend with API Key from environment variables
// If key is missing, it will throw an error or handle gracefully depending on Resend sdk behavior
const resend = new Resend(process.env.RESEND_API_KEY)

// Define the sender email address (must be verified in Resend)
const SENDER_EMAIL = 'onboarding@resend.dev' // Default testing email
// For production, change this to: 'notifications@capdigital.company' (after domain verification)

export async function sendTaskCreatedEmail(
    to: string,
    taskTitle: string,
    projectName: string,
    traderName: string
) {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY is not set. Skipping email.')
            return
        }

        const { data, error } = await resend.emails.send({
            from: SENDER_EMAIL,
            to: [to],
            subject: `Nova Tarefa Atribuída: ${taskTitle}`,
            html: `
        <h1>Nova Tarefa Atribuída</h1>
        <p>Olá <strong>${traderName}</strong>,</p>
        <p>Uma nova tarefa foi atribuída a você no projeto <strong>${projectName}</strong>.</p>
        <p><strong>Título:</strong> ${taskTitle}</p>
        <p>Acesse o CAP Manager para ver mais detalhes.</p>
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

        const { data, error } = await resend.emails.send({
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
