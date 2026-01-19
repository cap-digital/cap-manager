-- Add missing columns to cap_manager.cards_kanban

ALTER TABLE cap_manager.cards_kanban 
ADD COLUMN IF NOT EXISTS observador_id INTEGER REFERENCES cap_manager.usuarios(id) ON DELETE SET NULL;

ALTER TABLE cap_manager.cards_kanban 
ADD COLUMN IF NOT EXISTS data_inicio DATE;

-- Verify creation
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'cap_manager' 
AND table_name = 'cards_kanban' 
AND column_name IN ('observador_id', 'data_inicio');
