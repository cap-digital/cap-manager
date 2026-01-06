import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validação das variáveis de ambiente
if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL não está definida')
}
if (!supabaseAnonKey) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida')
}

// Cliente público (para uso no frontend)
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)
