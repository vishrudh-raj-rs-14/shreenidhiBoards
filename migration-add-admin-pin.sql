-- Migration script to add admin_pin_hash column to app_config table
-- Run this in your Supabase SQL Editor BEFORE setting up admin PIN

-- Add admin_pin_hash column
ALTER TABLE app_config 
ADD COLUMN IF NOT EXISTS admin_pin_hash TEXT;

-- Add updated_at column if it doesn't exist
ALTER TABLE app_config 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_config' 
AND column_name IN ('admin_pin_hash', 'updated_at');
