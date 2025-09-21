-- Fix the createdBy column to allow NULL values
ALTER TABLE notifications ALTER COLUMN "createdBy" DROP NOT NULL;
