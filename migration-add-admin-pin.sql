-- Migration script to add admin_pin_hash column to app_config table
-- Run this in your Supabase SQL Editor

ALTER TABLE app_config 
ADD COLUMN IF NOT EXISTS admin_pin_hash TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
