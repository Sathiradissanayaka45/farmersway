-- Update rice_sales table to add packet columns
-- Author: Database Update Script
-- Date: September 28, 2025
-- Purpose: Add packet_size and packet_quantity columns to rice_sales table

-- Step 1: Add new columns
ALTER TABLE rice_sales 
ADD COLUMN packet_size DECIMAL(5,2) NULL AFTER rice_variety_id,
ADD COLUMN packet_quantity INT NULL AFTER packet_size;

-- Step 2: Update existing records to maintain compatibility
UPDATE rice_sales 
SET packet_size = 1, 
    packet_quantity = quantity_kg 
WHERE packet_size IS NULL;

-- Step 3: Make packet fields NOT NULL for new records
ALTER TABLE rice_sales 
MODIFY COLUMN packet_size DECIMAL(5,2) NOT NULL,
MODIFY COLUMN packet_quantity INT NOT NULL;
