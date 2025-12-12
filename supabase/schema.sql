-- =============================================
-- CAP MANAGER - Schema do Banco de Dados
-- Prefixo: cap_manager_
-- =============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: cap_manager_usuarios
-- =============================================
CREATE TABLE IF NOT EXISTS cap_manager_usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'trader' CHECK (role IN ('admin', 'trader', 'gestor', 'cliente')),
  whatsapp TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: cap_manager_agencias
-- =============================================
CREATE TABLE IF NOT EXISTS cap_manager_agencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  porcentagem DECIMAL(5,2) NOT NULL DEFAULT 0,
  local TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: cap_manager_clientes
-- =============================================
CREATE TABLE IF NOT EXISTS cap_manager_clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  agencia_id UUID REFERENCES cap_manager_agencias(id) ON DELETE SET NULL,
  link_drive TEXT,
  contato TEXT NOT NULL,
  cnpj TEXT,
  email TEXT NOT NULL,
  dia_cobranca INTEGER NOT NULL DEFAULT 1 CHECK (dia_cobranca >= 1 AND dia_cobranca <= 31),
  forma_pagamento TEXT NOT NULL DEFAULT 'pix' CHECK (forma_pagamento IN ('pix', 'boleto', 'cartao', 'transferencia')),
  whatsapp TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: cap_manager_campanhas
-- =============================================
CREATE TABLE IF NOT EXISTS cap_manager_campanhas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES cap_manager_clientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  pi TEXT,
  porcentagem_plataforma DECIMAL(5,2) NOT NULL DEFAULT 0,
  porcentagem_agencia DECIMAL(5,2) NOT NULL DEFAULT 0,
  trader_id UUID REFERENCES cap_manager_usuarios(id) ON DELETE SET NULL,
  objetivo TEXT NOT NULL CHECK (objetivo IN ('awareness', 'consideracao', 'conversao', 'leads', 'vendas', 'trafego', 'engajamento')),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'ativa', 'pausada', 'finalizada', 'cancelada')),
  id_campanha_plataforma TEXT NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  orcamento DECIMAL(12,2),
  nomenclatura_padrao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: cap_manager_tarefas (Kanban)
-- =============================================
CREATE TABLE IF NOT EXISTS cap_manager_tarefas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'doing', 'review', 'done')),
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  campanha_id UUID REFERENCES cap_manager_campanhas(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES cap_manager_clientes(id) ON DELETE SET NULL,
  responsavel_id UUID REFERENCES cap_manager_usuarios(id) ON DELETE SET NULL,
  data_vencimento DATE,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: cap_manager_follow_ups
-- =============================================
CREATE TABLE IF NOT EXISTS cap_manager_follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campanha_id UUID NOT NULL REFERENCES cap_manager_campanhas(id) ON DELETE CASCADE,
  trader_id UUID NOT NULL REFERENCES cap_manager_usuarios(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'nota' CHECK (tipo IN ('nota', 'alerta', 'atualizacao', 'reuniao')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: cap_manager_utm_configs
-- =============================================
CREATE TABLE IF NOT EXISTS cap_manager_utm_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campanha_id UUID REFERENCES cap_manager_campanhas(id) ON DELETE CASCADE,
  utm_source TEXT NOT NULL,
  utm_medium TEXT NOT NULL,
  utm_campaign TEXT NOT NULL,
  utm_term TEXT,
  utm_content TEXT,
  url_destino TEXT NOT NULL,
  url_gerada TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABELA: cap_manager_alertas
-- =============================================
CREATE TABLE IF NOT EXISTS cap_manager_alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('cobranca', 'campanha', 'tarefa', 'sistema')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  destinatario_id UUID NOT NULL REFERENCES cap_manager_usuarios(id) ON DELETE CASCADE,
  lido BOOLEAN NOT NULL DEFAULT false,
  enviado_whatsapp BOOLEAN NOT NULL DEFAULT false,
  data_envio_whatsapp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_cap_manager_clientes_agencia ON cap_manager_clientes(agencia_id);
CREATE INDEX IF NOT EXISTS idx_cap_manager_campanhas_cliente ON cap_manager_campanhas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cap_manager_campanhas_trader ON cap_manager_campanhas(trader_id);
CREATE INDEX IF NOT EXISTS idx_cap_manager_campanhas_status ON cap_manager_campanhas(status);
CREATE INDEX IF NOT EXISTS idx_cap_manager_tarefas_status ON cap_manager_tarefas(status);
CREATE INDEX IF NOT EXISTS idx_cap_manager_tarefas_responsavel ON cap_manager_tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_cap_manager_tarefas_campanha ON cap_manager_tarefas(campanha_id);
CREATE INDEX IF NOT EXISTS idx_cap_manager_follow_ups_campanha ON cap_manager_follow_ups(campanha_id);
CREATE INDEX IF NOT EXISTS idx_cap_manager_follow_ups_trader ON cap_manager_follow_ups(trader_id);
CREATE INDEX IF NOT EXISTS idx_cap_manager_alertas_destinatario ON cap_manager_alertas(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_cap_manager_alertas_lido ON cap_manager_alertas(lido);

-- =============================================
-- TRIGGERS para updated_at
-- =============================================
CREATE OR REPLACE FUNCTION cap_manager_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cap_manager_usuarios_updated_at ON cap_manager_usuarios;
CREATE TRIGGER update_cap_manager_usuarios_updated_at
  BEFORE UPDATE ON cap_manager_usuarios
  FOR EACH ROW EXECUTE FUNCTION cap_manager_update_updated_at_column();

DROP TRIGGER IF EXISTS update_cap_manager_agencias_updated_at ON cap_manager_agencias;
CREATE TRIGGER update_cap_manager_agencias_updated_at
  BEFORE UPDATE ON cap_manager_agencias
  FOR EACH ROW EXECUTE FUNCTION cap_manager_update_updated_at_column();

DROP TRIGGER IF EXISTS update_cap_manager_clientes_updated_at ON cap_manager_clientes;
CREATE TRIGGER update_cap_manager_clientes_updated_at
  BEFORE UPDATE ON cap_manager_clientes
  FOR EACH ROW EXECUTE FUNCTION cap_manager_update_updated_at_column();

DROP TRIGGER IF EXISTS update_cap_manager_campanhas_updated_at ON cap_manager_campanhas;
CREATE TRIGGER update_cap_manager_campanhas_updated_at
  BEFORE UPDATE ON cap_manager_campanhas
  FOR EACH ROW EXECUTE FUNCTION cap_manager_update_updated_at_column();

DROP TRIGGER IF EXISTS update_cap_manager_tarefas_updated_at ON cap_manager_tarefas;
CREATE TRIGGER update_cap_manager_tarefas_updated_at
  BEFORE UPDATE ON cap_manager_tarefas
  FOR EACH ROW EXECUTE FUNCTION cap_manager_update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE cap_manager_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager_agencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager_campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager_utm_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager_alertas ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
DROP POLICY IF EXISTS "cap_manager_usuarios_select" ON cap_manager_usuarios;
CREATE POLICY "cap_manager_usuarios_select" ON cap_manager_usuarios FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cap_manager_usuarios_update" ON cap_manager_usuarios;
CREATE POLICY "cap_manager_usuarios_update" ON cap_manager_usuarios FOR UPDATE TO authenticated USING (auth_id = auth.uid());
DROP POLICY IF EXISTS "cap_manager_usuarios_insert" ON cap_manager_usuarios;
CREATE POLICY "cap_manager_usuarios_insert" ON cap_manager_usuarios FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "cap_manager_agencias_select" ON cap_manager_agencias;
CREATE POLICY "cap_manager_agencias_select" ON cap_manager_agencias FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cap_manager_agencias_all" ON cap_manager_agencias;
CREATE POLICY "cap_manager_agencias_all" ON cap_manager_agencias FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM cap_manager_usuarios WHERE auth_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "cap_manager_clientes_select" ON cap_manager_clientes;
CREATE POLICY "cap_manager_clientes_select" ON cap_manager_clientes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cap_manager_clientes_all" ON cap_manager_clientes;
CREATE POLICY "cap_manager_clientes_all" ON cap_manager_clientes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM cap_manager_usuarios WHERE auth_id = auth.uid() AND role IN ('admin', 'gestor'))
);

DROP POLICY IF EXISTS "cap_manager_campanhas_select" ON cap_manager_campanhas;
CREATE POLICY "cap_manager_campanhas_select" ON cap_manager_campanhas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cap_manager_campanhas_all" ON cap_manager_campanhas;
CREATE POLICY "cap_manager_campanhas_all" ON cap_manager_campanhas FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "cap_manager_tarefas_select" ON cap_manager_tarefas;
CREATE POLICY "cap_manager_tarefas_select" ON cap_manager_tarefas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cap_manager_tarefas_all" ON cap_manager_tarefas;
CREATE POLICY "cap_manager_tarefas_all" ON cap_manager_tarefas FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "cap_manager_follow_ups_select" ON cap_manager_follow_ups;
CREATE POLICY "cap_manager_follow_ups_select" ON cap_manager_follow_ups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cap_manager_follow_ups_insert" ON cap_manager_follow_ups;
CREATE POLICY "cap_manager_follow_ups_insert" ON cap_manager_follow_ups FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "cap_manager_utm_configs_select" ON cap_manager_utm_configs;
CREATE POLICY "cap_manager_utm_configs_select" ON cap_manager_utm_configs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cap_manager_utm_configs_all" ON cap_manager_utm_configs;
CREATE POLICY "cap_manager_utm_configs_all" ON cap_manager_utm_configs FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "cap_manager_alertas_select" ON cap_manager_alertas;
CREATE POLICY "cap_manager_alertas_select" ON cap_manager_alertas FOR SELECT TO authenticated USING (
  destinatario_id IN (SELECT id FROM cap_manager_usuarios WHERE auth_id = auth.uid())
);
DROP POLICY IF EXISTS "cap_manager_alertas_insert" ON cap_manager_alertas;
CREATE POLICY "cap_manager_alertas_insert" ON cap_manager_alertas FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "cap_manager_alertas_update" ON cap_manager_alertas;
CREATE POLICY "cap_manager_alertas_update" ON cap_manager_alertas FOR UPDATE TO authenticated USING (
  destinatario_id IN (SELECT id FROM cap_manager_usuarios WHERE auth_id = auth.uid())
);

-- =============================================
-- FUNÇÃO: Criar usuário após signup
-- =============================================
CREATE OR REPLACE FUNCTION public.cap_manager_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.cap_manager_usuarios (auth_id, email, nome, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'trader')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error creating user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Garantir que o service role pode inserir usuários
DROP POLICY IF EXISTS "cap_manager_usuarios_service_insert" ON cap_manager_usuarios;
CREATE POLICY "cap_manager_usuarios_service_insert" ON cap_manager_usuarios
  FOR INSERT TO service_role WITH CHECK (true);

-- Trigger para criar usuário automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created_cap_manager ON auth.users;
CREATE TRIGGER on_auth_user_created_cap_manager
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.cap_manager_handle_new_user();
