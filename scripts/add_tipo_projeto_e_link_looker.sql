-- Migration: Adiciona tipo_projeto e link_looker_studio à tabela inteligencia_projetos
-- Execute este script no Supabase SQL Editor

-- Adiciona coluna tipo_projeto (enum: dashboard, lp, site, saas)
ALTER TABLE cap_manager_inteligencia_projetos
ADD COLUMN IF NOT EXISTS tipo_projeto TEXT DEFAULT 'lp';

-- Adiciona coluna link_looker_studio
ALTER TABLE cap_manager_inteligencia_projetos
ADD COLUMN IF NOT EXISTS link_looker_studio TEXT;

-- Opcional: Criar constraint para validar os valores do tipo_projeto
-- ALTER TABLE cap_manager_inteligencia_projetos
-- ADD CONSTRAINT check_tipo_projeto CHECK (tipo_projeto IN ('dashboard', 'lp', 'site', 'saas'));
