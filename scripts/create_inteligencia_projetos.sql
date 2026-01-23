-- Drop table and related objects to ensure clean install (Warning: all data in this table will be lost)
DROP TABLE IF EXISTS cap_manager_inteligencia_projetos CASCADE;

-- Create table for Inteligência Projetos
CREATE TABLE cap_manager_inteligencia_projetos (
    id SERIAL PRIMARY KEY,
    nome_projeto TEXT NOT NULL,
    data_criacao DATE DEFAULT CURRENT_DATE,
    link_lovable TEXT,
    link_vercel TEXT,
    link_render_railway TEXT,
    link_dominio TEXT,
    feito_por_id INTEGER REFERENCES cap_manager_usuarios(id) ON DELETE SET NULL,
    revisado_por_id INTEGER REFERENCES cap_manager_usuarios(id) ON DELETE SET NULL,
    cliente_id INTEGER REFERENCES cap_manager_clientes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cap_manager_inteligencia_projetos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access to authenticated users (standard for this app)
-- No need to drop since table was dropped above
CREATE POLICY "Allow all access to authenticated users" ON cap_manager_inteligencia_projetos
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create trigger for updated_at (function might already exist, so we use OR REPLACE)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inteligencia_projetos_updated_at
    BEFORE UPDATE ON cap_manager_inteligencia_projetos
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
