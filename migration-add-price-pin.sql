-- Migration: Add price_pin_hash column to app_config table
-- This column stores the hashed PIN required for updating prices

ALTER TABLE app_config 
ADD COLUMN IF NOT EXISTS price_pin_hash TEXT;
