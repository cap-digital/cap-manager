import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sql = `
CREATE TABLE IF NOT EXISTS cap_manager_login_logs (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES cap_manager_usuarios(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'credentials',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_logs_usuario_id ON cap_manager_login_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON cap_manager_login_logs(created_at);
`

const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

if (error) {
  console.error('❌ Erro ao criar tabela:', error)
  process.exit(1)
}

console.log('✅ Tabela cap_manager_login_logs criada com sucesso!')
