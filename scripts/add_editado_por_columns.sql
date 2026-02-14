-- Adicionar colunas de rastreamento de última edição na tabela projetos
ALTER TABLE cap_manager.projetos
ADD COLUMN IF NOT EXISTS editado_por_id INTEGER REFERENCES cap_manager.usuarios(id),
ADD COLUMN IF NOT EXISTS editado_por_nome VARCHAR(255);
