export type StatusAutomacao = 'rascunho' | 'ativa' | 'pausada' | 'erro'
export type TipoLogAutomacao = 'lead_recebido' | 'erro' | 'webhook_registrado' | 'conexao' | 'desconexao'

export interface FieldMappingItem {
  form_field: string
  form_field_label: string
  sheet_column: string
}

export interface AutomacaoRecord {
  id: number
  user_id: number
  nome: string
  status: StatusAutomacao
  meta_connection_id: number | null
  meta_page_id: string | null
  meta_page_name: string | null
  meta_page_token_encrypted: string | null
  meta_form_id: string | null
  meta_form_name: string | null
  google_connection_id: number | null
  spreadsheet_id: string | null
  spreadsheet_name: string | null
  sheet_name: string | null
  field_mapping: FieldMappingItem[]
  webhook_verify_token: string | null
  webhook_active: boolean
  leads_count: number
  last_lead_at: string | null
  created_at: string
  updated_at: string
}

export interface AutomacaoLog {
  id: number
  automacao_id: number
  tipo: TipoLogAutomacao
  mensagem: string
  dados: Record<string, any> | null
  lead_id: string | null
  created_at: string
}

export interface MetaConnection {
  id: number
  user_id: number
  meta_user_id: string
  meta_user_name: string | null
  access_token_encrypted: string
  token_expires_at: string | null
  is_valid: boolean
}

export interface GoogleConnection {
  id: number
  user_id: number
  google_email: string
  access_token_encrypted: string
  refresh_token_encrypted: string
  token_expires_at: string | null
  is_valid: boolean
}
