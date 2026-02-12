-- =============================================
-- Módulo Automações: Facebook Leads → Google Sheets
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1. Conexões Meta (Facebook)
CREATE TABLE cap_manager_meta_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES cap_manager_usuarios(id) ON DELETE CASCADE,
  meta_user_id TEXT NOT NULL,
  meta_user_name TEXT,
  access_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Conexões Google (Sheets)
CREATE TABLE cap_manager_google_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES cap_manager_usuarios(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Automações
CREATE TABLE cap_manager_automacoes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES cap_manager_usuarios(id),
  nome TEXT NOT NULL,
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'ativa', 'pausada', 'erro')),
  -- Meta config
  meta_connection_id INTEGER REFERENCES cap_manager_meta_connections(id) ON DELETE SET NULL,
  meta_page_id TEXT,
  meta_page_name TEXT,
  meta_page_token_encrypted TEXT,
  meta_form_id TEXT,
  meta_form_name TEXT,
  -- Google config
  google_connection_id INTEGER REFERENCES cap_manager_google_connections(id) ON DELETE SET NULL,
  spreadsheet_id TEXT,
  spreadsheet_name TEXT,
  sheet_name TEXT,
  -- Mapeamento de campos
  field_mapping JSONB DEFAULT '[]',
  -- Webhook
  webhook_verify_token TEXT,
  webhook_active BOOLEAN DEFAULT false,
  -- Stats
  leads_count INTEGER DEFAULT 0,
  last_lead_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automacoes_user_id ON cap_manager_automacoes(user_id);
CREATE INDEX idx_automacoes_status ON cap_manager_automacoes(status);
CREATE INDEX idx_automacoes_page_form ON cap_manager_automacoes(meta_page_id, meta_form_id);

-- 4. Logs de automações
CREATE TABLE cap_manager_automacao_logs (
  id SERIAL PRIMARY KEY,
  automacao_id INTEGER NOT NULL REFERENCES cap_manager_automacoes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('lead_recebido', 'erro', 'webhook_registrado', 'conexao', 'desconexao')),
  mensagem TEXT NOT NULL,
  dados JSONB,
  lead_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automacao_logs_automacao_id ON cap_manager_automacao_logs(automacao_id);
CREATE INDEX idx_automacao_logs_created_at ON cap_manager_automacao_logs(created_at DESC);
CREATE INDEX idx_automacao_logs_lead_id ON cap_manager_automacao_logs(lead_id);
