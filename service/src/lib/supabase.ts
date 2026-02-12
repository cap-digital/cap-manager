import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export const TABLES = {
  meta_connections: 'cap_manager_meta_connections',
  google_connections: 'cap_manager_google_connections',
  automacoes: 'cap_manager_automacoes',
  automacao_logs: 'cap_manager_automacao_logs',
} as const
