-- Migration script to update party grades from 'purchaser'/'supplier' to 'purchase_party'/'supply_party'
-- Run this in your Supabase SQL Editor if you have existing data

-- First, update the existing data
UPDATE parties SET grade = 'purchase_party' WHERE grade = 'supplier';
UPDATE parties SET grade = 'supply_party' WHERE grade = 'purchaser';

-- Then, update the constraint
ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_grade_check;
ALTER TABLE parties ADD CONSTRAINT parties_grade_check CHECK (grade IN ('purchase_party', 'supply_party'));
