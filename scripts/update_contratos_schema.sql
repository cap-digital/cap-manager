-- Add 'pago' column to contracts table
ALTER TABLE public.cap_manager_contratos 
ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT FALSE;

-- Optional: update existing records to false (already covered by default, but good to be explicit if needed)
-- UPDATE public.cap_manager_contratos SET pago = FALSE WHERE pago IS NULL;
