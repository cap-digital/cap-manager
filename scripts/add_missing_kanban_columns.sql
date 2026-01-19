-- Add missing columns to cap_manager_cards_kanban (PUBLIC SCHEMA)

ALTER TABLE cap_manager_cards_kanban 
ADD COLUMN IF NOT EXISTS observador_id INTEGER REFERENCES cap_manager_usuarios(id) ON DELETE SET NULL;

ALTER TABLE cap_manager_cards_kanban 
ADD COLUMN IF NOT EXISTS data_inicio DATE;

ALTER TABLE cap_manager_cards_kanban 
ADD COLUMN IF NOT EXISTS categoria TEXT;

-- Force Supabase API schema cache reload
NOTIFY pgrst, 'reload config';
