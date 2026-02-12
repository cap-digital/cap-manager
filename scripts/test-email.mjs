import { Resend } from 'resend'
import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carregar .env.local
config({ path: join(__dirname, '..', '.env.local') })

const resend = new Resend(process.env.RESEND_API_KEY)

console.log('🔑 API Key:', process.env.RESEND_API_KEY ? 'Configurada' : 'NÃO ENCONTRADA')

async function testEmail() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'dados@capdigital.company',
      to: ['gustavo@capdigital.company'],
      subject: 'Teste CAP Manager - Notificações',
      html: `
        <h1>Teste de Notificação</h1>
        <p>Se você recebeu este email, o sistema de notificações do CAP Manager está funcionando corretamente!</p>
        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      `,
    })

    if (error) {
      console.error('❌ Erro ao enviar email:', error)
      return
    }

    console.log('✅ Email enviado com sucesso!')
    console.log('📧 ID:', data.id)
    console.log('\n⚠️  IMPORTANTE: Verifique sua caixa de entrada (e spam) em: gustavo@capdigital.company')
  } catch (err) {
    console.error('❌ Erro inesperado:', err)
  }
}

testEmail()
