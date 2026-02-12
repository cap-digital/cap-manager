import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUser() {
  console.log('🔍 Buscando usuários com "Gustavo" no nome...\n')

  const { data: users, error } = await supabase
    .from('cap_manager_usuarios')
    .select('*')
    .ilike('nome', '%gustavo%')

  if (error) {
    console.error('❌ Erro:', error)
    return
  }

  if (!users || users.length === 0) {
    console.log('⚠️  Nenhum usuário encontrado com "Gustavo" no nome')
    return
  }

  console.log('✅ Usuários encontrados:\n')
  users.forEach(user => {
    console.log(`👤 ${user.nome} (ID: ${user.id})`)
    console.log(`   Email principal: ${user.email}`)
    console.log(`   Email notificações: ${user.email_notificacoes || '(não configurado)'}`)
    console.log(`   📧 Email que será usado: ${user.email_notificacoes || user.email}`)
    console.log('')
  })

  console.log('\n🔍 Verificando últimas tarefas criadas...\n')

  const { data: tasks } = await supabase
    .from('cap_manager_cards_kanban')
    .select('id, titulo, trader_id, responsavel_relatorio_id, area, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (tasks && tasks.length > 0) {
    console.log('📋 Últimas 5 tarefas:\n')
    tasks.forEach(task => {
      console.log(`   ${task.titulo}`)
      console.log(`   - Área: ${task.area}`)
      console.log(`   - Trader ID: ${task.trader_id || '(não atribuído)'}`)
      console.log(`   - Criada em: ${new Date(task.created_at).toLocaleString('pt-BR')}`)
      console.log('')
    })
  }
}

checkUser()
