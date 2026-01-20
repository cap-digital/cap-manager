-- Adicionar colunas faltantes na tabela de estrategias
ALTER TABLE cap_manager.estrategias 
ADD COLUMN IF NOT EXISTS observacao TEXT,
ADD COLUMN IF NOT EXISTS plataforma_custom VARCHAR(255);

-- Se necessário, recarregar o schema cache (o Supabase faz isso automaticamente, mas é bom saber)
NOTIFY pgrst, 'reload schema';
