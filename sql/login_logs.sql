CREATE TABLE IF NOT EXISTS cap_manager_login_logs (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES cap_manager_usuarios(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'credentials',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_login_logs_usuario_id ON cap_manager_login_logs(usuario_id);
CREATE INDEX idx_login_logs_created_at ON cap_manager_login_logs(created_at);
