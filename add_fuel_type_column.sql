-- Add fuel_type column to petrol_expenses table
ALTER TABLE public.petrol_expenses
ADD COLUMN IF NOT EXISTS fuel_type TEXT CHECK (fuel_type IN ('petrol', 'diesel')) DEFAULT 'petrol';
