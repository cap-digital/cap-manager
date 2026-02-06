-- =============================================
-- CAP MANAGER - Schema PostgreSQL para Supabase
-- Usando schema: cap_manager
-- =============================================

-- Criar o schema cap_manager se não existir
CREATE SCHEMA IF NOT EXISTS cap_manager;

-- Definir o schema cap_manager como padrão para esta sessão
SET search_path TO cap_manager, public;

-- Dropar tabelas existentes (se houver) no schema cap_manager
DROP TABLE IF EXISTS cap_manager.cards_kanban CASCADE;
DROP TABLE IF EXISTS cap_manager.alertas CASCADE;
DROP TABLE IF EXISTS cap_manager.utm_configs CASCADE;
DROP TABLE IF EXISTS cap_manager.revisoes_diarias CASCADE;
DROP TABLE IF EXISTS cap_manager.follow_ups CASCADE;
DROP TABLE IF EXISTS cap_manager.tarefas CASCADE;
DROP TABLE IF EXISTS cap_manager.estrategias CASCADE;
DROP TABLE IF EXISTS cap_manager.projetos CASCADE;
DROP TABLE IF EXISTS cap_manager.pis CASCADE;
DROP TABLE IF EXISTS cap_manager.clientes CASCADE;
DROP TABLE IF EXISTS cap_manager.agencias CASCADE;
DROP TABLE IF EXISTS cap_manager.usuarios CASCADE;

-- Dropar ENUMs existentes (se houver) no schema cap_manager
DROP TYPE IF EXISTS cap_manager.role_type CASCADE;
DROP TYPE IF EXISTS cap_manager.tipo_cobranca_type CASCADE;
DROP TYPE IF EXISTS cap_manager.status_projeto_type CASCADE;
DROP TYPE IF EXISTS cap_manager.grupo_revisao_type CASCADE;
DROP TYPE IF EXISTS cap_manager.plataforma_type CASCADE;
DROP TYPE IF EXISTS cap_manager.status_estrategia_type CASCADE;
DROP TYPE IF EXISTS cap_manager.status_tarefa_type CASCADE;
DROP TYPE IF EXISTS cap_manager.prioridade_tarefa_type CASCADE;
DROP TYPE IF EXISTS cap_manager.tipo_followup_type CASCADE;
DROP TYPE IF EXISTS cap_manager.tipo_alerta_type CASCADE;
DROP TYPE IF EXISTS cap_manager.area_kanban_type CASCADE;

-- Criar ENUMs no schema cap_manager
CREATE TYPE cap_manager.role_type AS ENUM ('admin', 'trader', 'gestor', 'cliente');
CREATE TYPE cap_manager.tipo_cobranca_type AS ENUM ('td', 'fee');
CREATE TYPE cap_manager.status_projeto_type AS ENUM ('rascunho', 'ativo', 'pausado', 'finalizado', 'cancelado');
CREATE TYPE cap_manager.grupo_revisao_type AS ENUM ('A', 'B', 'C');
CREATE TYPE cap_manager.plataforma_type AS ENUM ('meta', 'google', 'tiktok', 'linkedin', 'twitter', 'pinterest', 'spotify', 'programatica', 'outro');
CREATE TYPE cap_manager.status_estrategia_type AS ENUM ('planejada', 'em_aprovacao', 'ativa', 'pausada', 'finalizada', 'cancelada');
CREATE TYPE cap_manager.status_tarefa_type AS ENUM ('backlog', 'todo', 'doing', 'review', 'done');
CREATE TYPE cap_manager.prioridade_tarefa_type AS ENUM ('baixa', 'media', 'alta', 'urgente');
CREATE TYPE cap_manager.tipo_followup_type AS ENUM ('nota', 'alerta', 'atualizacao', 'reuniao');
CREATE TYPE cap_manager.tipo_alerta_type AS ENUM ('cobranca', 'campanha', 'tarefa', 'sistema');
CREATE TYPE cap_manager.area_kanban_type AS ENUM ('gestao_trafego', 'faturamento', 'dashboards', 'gtm', 'sites_lp', 'projetos_concluidos');

-- Tabela: usuarios
CREATE TABLE cap_manager.usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  role cap_manager.role_type DEFAULT 'trader',
  whatsapp VARCHAR(50),
  email_notificacoes VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuarios_role ON cap_manager.usuarios(role);
CREATE INDEX idx_usuarios_ativo ON cap_manager.usuarios(ativo);

-- Tabela: agencias
CREATE TABLE cap_manager.agencias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(20),
  telefone VARCHAR(50),
  email VARCHAR(255),
  contato VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: clientes
CREATE TABLE cap_manager.clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  agencia_id INTEGER REFERENCES cap_manager.agencias(id) ON DELETE SET NULL,
  contato VARCHAR(255),
  cnpj VARCHAR(20),
  email VARCHAR(255),
  whatsapp VARCHAR(50),
  tipo_cobranca cap_manager.tipo_cobranca_type DEFAULT 'td',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clientes_ativo ON cap_manager.clientes(ativo);
CREATE INDEX idx_clientes_agencia ON cap_manager.clientes(agencia_id);

-- Tabela: pis
CREATE TABLE cap_manager.pis (
  id SERIAL PRIMARY KEY,
  identificador VARCHAR(255) UNIQUE NOT NULL,
  valor_bruto DECIMAL(12, 2) NOT NULL,
  agencia_id INTEGER REFERENCES cap_manager.agencias(id) ON DELETE SET NULL,
  cliente_id INTEGER REFERENCES cap_manager.clientes(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: projetos
CREATE TABLE cap_manager.projetos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES cap_manager.clientes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  pi_id INTEGER REFERENCES cap_manager.pis(id) ON DELETE SET NULL,
  tipo_cobranca cap_manager.tipo_cobranca_type DEFAULT 'td',
  agencia_id INTEGER REFERENCES cap_manager.agencias(id) ON DELETE SET NULL,
  trader_id INTEGER REFERENCES cap_manager.usuarios(id) ON DELETE SET NULL,
  colaborador_id INTEGER REFERENCES cap_manager.usuarios(id) ON DELETE SET NULL,
  status cap_manager.status_projeto_type DEFAULT 'rascunho',
  data_inicio DATE,
  data_fim DATE,
  link_proposta VARCHAR(500),
  url_destino TEXT,
  grupo_revisao cap_manager.grupo_revisao_type,
  revisao_final_ok BOOLEAN DEFAULT false,
  revisao_final_data TIMESTAMP,
  revisao_final_usuario_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projetos_status ON cap_manager.projetos(status);
CREATE INDEX idx_projetos_cliente ON cap_manager.projetos(cliente_id);
CREATE INDEX idx_projetos_trader ON cap_manager.projetos(trader_id);
CREATE INDEX idx_projetos_status_cliente ON cap_manager.projetos(status, cliente_id);
CREATE INDEX idx_projetos_grupo_revisao ON cap_manager.projetos(grupo_revisao);

-- Tabela: estrategias
CREATE TABLE cap_manager.estrategias (
  id SERIAL PRIMARY KEY,
  projeto_id INTEGER NOT NULL REFERENCES cap_manager.projetos(id) ON DELETE CASCADE,
  plataforma cap_manager.plataforma_type NOT NULL,
  nome_conta VARCHAR(255),
  id_conta VARCHAR(255),
  campaign_id VARCHAR(255),
  estrategia VARCHAR(500),
  kpi VARCHAR(100),
  status cap_manager.status_estrategia_type DEFAULT 'planejada',
  data_inicio DATE,
  valor_bruto DECIMAL(12, 2) DEFAULT 0,
  porcentagem_agencia DECIMAL(5, 2) DEFAULT 0,
  porcentagem_plataforma DECIMAL(5, 2) DEFAULT 0,
  valor_liquido DECIMAL(12, 2),
  valor_plataforma DECIMAL(12, 2),
  coeficiente DECIMAL(8, 6),
  valor_por_dia_plataforma DECIMAL(12, 2),
  valor_restante DECIMAL(12, 2),
  restante_por_dia DECIMAL(12, 2),
  entrega_contratada DECIMAL(12, 2),
  percentual_entrega DECIMAL(8, 4),
  estimativa_resultado DECIMAL(12, 2),
  estimativa_sucesso DECIMAL(8, 4),
  meta_custo_resultado DECIMAL(12, 2),
  custo_resultado DECIMAL(12, 2),
  gasto_ate_momento_bruto DECIMAL(12, 2),
  valor_restante_bruto DECIMAL(12, 2),
  pode_abaixar_margem BOOLEAN,
  pode_aumentar_margem BOOLEAN,
  gasto_ate_momento DECIMAL(12, 2),
  entregue_ate_momento DECIMAL(12, 2),
  data_atualizacao TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: tarefas
CREATE TABLE cap_manager.tarefas (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  status cap_manager.status_tarefa_type DEFAULT 'backlog',
  prioridade cap_manager.prioridade_tarefa_type DEFAULT 'media',
  projeto_id INTEGER REFERENCES cap_manager.projetos(id) ON DELETE SET NULL,
  cliente_id INTEGER REFERENCES cap_manager.clientes(id) ON DELETE SET NULL,
  responsavel_id INTEGER REFERENCES cap_manager.usuarios(id) ON DELETE SET NULL,
  data_vencimento DATE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tarefas_status ON cap_manager.tarefas(status);
CREATE INDEX idx_tarefas_responsavel ON cap_manager.tarefas(responsavel_id);
CREATE INDEX idx_tarefas_status_ordem ON cap_manager.tarefas(status, ordem);

-- Tabela: follow_ups
CREATE TABLE cap_manager.follow_ups (
  id SERIAL PRIMARY KEY,
  projeto_id INTEGER NOT NULL REFERENCES cap_manager.projetos(id) ON DELETE CASCADE,
  trader_id INTEGER NOT NULL REFERENCES cap_manager.usuarios(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  tipo cap_manager.tipo_followup_type DEFAULT 'nota',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: revisoes_diarias
CREATE TABLE cap_manager.revisoes_diarias (
  id SERIAL PRIMARY KEY,
  projeto_id INTEGER NOT NULL REFERENCES cap_manager.projetos(id) ON DELETE CASCADE,
  data_agendada DATE NOT NULL,
  revisado BOOLEAN DEFAULT false,
  data_revisao TIMESTAMP,
  revisado_por_id INTEGER REFERENCES cap_manager.usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(projeto_id, data_agendada)
);

CREATE INDEX idx_revisoes_data ON cap_manager.revisoes_diarias(data_agendada);
CREATE INDEX idx_revisoes_revisado ON cap_manager.revisoes_diarias(revisado);

-- Tabela: utm_configs
CREATE TABLE cap_manager.utm_configs (
  id SERIAL PRIMARY KEY,
  projeto_id INTEGER REFERENCES cap_manager.projetos(id) ON DELETE CASCADE,
  utm_source VARCHAR(255) NOT NULL,
  utm_medium VARCHAR(255) NOT NULL,
  utm_campaign VARCHAR(255) NOT NULL,
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  url_destino VARCHAR(500) NOT NULL,
  url_gerada TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: alertas
CREATE TABLE cap_manager.alertas (
  id SERIAL PRIMARY KEY,
  tipo cap_manager.tipo_alerta_type NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  destinatario_id INTEGER NOT NULL REFERENCES cap_manager.usuarios(id) ON DELETE CASCADE,
  lido BOOLEAN DEFAULT false,
  enviado_whatsapp BOOLEAN DEFAULT false,
  data_envio_whatsapp TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: cards_kanban
CREATE TABLE cap_manager.cards_kanban (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  area cap_manager.area_kanban_type NOT NULL,
  status VARCHAR(100) DEFAULT 'backlog',
  prioridade cap_manager.prioridade_tarefa_type DEFAULT 'media',
  cliente_id INTEGER,
  projeto_id INTEGER,
  trader_id INTEGER,
  responsavel_relatorio_id INTEGER,
  responsavel_revisao_id INTEGER,
  revisao_relatorio_ok BOOLEAN DEFAULT false,
  link_relatorio VARCHAR(500),
  faturamento_card_id INTEGER,
  data_vencimento DATE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) para todas as tabelas
ALTER TABLE cap_manager.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager.agencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager.pis ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager.estrategias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager.revisoes_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager.utm_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager.alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cap_manager.cards_kanban ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir acesso (ajuste conforme necessidade de segurança)
CREATE POLICY "Permitir tudo para usuarios" ON cap_manager.usuarios FOR ALL USING (true);
CREATE POLICY "Permitir tudo para agencias" ON cap_manager.agencias FOR ALL USING (true);
CREATE POLICY "Permitir tudo para clientes" ON cap_manager.clientes FOR ALL USING (true);
CREATE POLICY "Permitir tudo para pis" ON cap_manager.pis FOR ALL USING (true);
CREATE POLICY "Permitir tudo para projetos" ON cap_manager.projetos FOR ALL USING (true);
CREATE POLICY "Permitir tudo para estrategias" ON cap_manager.estrategias FOR ALL USING (true);
CREATE POLICY "Permitir tudo para tarefas" ON cap_manager.tarefas FOR ALL USING (true);
CREATE POLICY "Permitir tudo para follow_ups" ON cap_manager.follow_ups FOR ALL USING (true);
CREATE POLICY "Permitir tudo para revisoes_diarias" ON cap_manager.revisoes_diarias FOR ALL USING (true);
CREATE POLICY "Permitir tudo para utm_configs" ON cap_manager.utm_configs FOR ALL USING (true);
CREATE POLICY "Permitir tudo para alertas" ON cap_manager.alertas FOR ALL USING (true);
CREATE POLICY "Permitir tudo para cards_kanban" ON cap_manager.cards_kanban FOR ALL USING (true);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION cap_manager.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON cap_manager.usuarios FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();
CREATE TRIGGER update_agencias_updated_at BEFORE UPDATE ON cap_manager.agencias FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON cap_manager.clientes FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();
CREATE TRIGGER update_pis_updated_at BEFORE UPDATE ON cap_manager.pis FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();
CREATE TRIGGER update_projetos_updated_at BEFORE UPDATE ON cap_manager.projetos FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();
CREATE TRIGGER update_estrategias_updated_at BEFORE UPDATE ON cap_manager.estrategias FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();
CREATE TRIGGER update_tarefas_updated_at BEFORE UPDATE ON cap_manager.tarefas FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();
CREATE TRIGGER update_revisoes_updated_at BEFORE UPDATE ON cap_manager.revisoes_diarias FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();
CREATE TRIGGER update_cards_kanban_updated_at BEFORE UPDATE ON cap_manager.cards_kanban FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();

-- Concluído!
SELECT 'Schema CAP Manager criado com sucesso no schema cap_manager!' as status;
