-- Migration: Add Offer Price and Extended Intervals to Plans
-- Description: Adds 'offer_price' column and updates 'interval' check constraint.

-- 1. Add offer_price column
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS offer_price DECIMAL(10, 2);

-- 2. Update Intervals
-- We drop the constraint blindly to be safe, then re-add it with new values.
ALTER TABLE public.plans 
DROP CONSTRAINT IF EXISTS plans_interval_check;

ALTER TABLE public.plans 
ADD CONSTRAINT plans_interval_check 
CHECK (interval IN ('month', 'quarterly', 'half_yearly', 'year'));
