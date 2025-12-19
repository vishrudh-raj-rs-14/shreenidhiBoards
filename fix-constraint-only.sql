-- Quick fix: Update the constraint only (run this first if you're getting constraint errors)
-- This allows you to insert new data with 'purchase_party' and 'supply_party'

ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_grade_check;
ALTER TABLE parties ADD CONSTRAINT parties_grade_check CHECK (grade IN ('purchase_party', 'supply_party'));
