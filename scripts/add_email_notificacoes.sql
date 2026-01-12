-- Adicionar campo email_notificacoes na tabela usuarios
-- Este campo permite que o usuário configure um email diferente para receber notificações

ALTER TABLE cap_manager.usuarios 
ADD COLUMN IF NOT EXISTS email_notificacoes VARCHAR(255);

-- Criar índice para melhorar performance em consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_email_notificacoes ON cap_manager.usuarios(email_notificacoes);

-- Comentário explicativo
COMMENT ON COLUMN cap_manager.usuarios.email_notificacoes IS 'Email alternativo para receber notificações do sistema. Se não preenchido, usa o email principal do usuário.';
