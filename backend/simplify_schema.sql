-- Disable foreign key checks to prevent conflicts during structural changes
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Find and Drop Foreign Key on trip_instances.bus_id
SET @constraint_name = (
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_NAME = 'trip_instances' 
    AND COLUMN_NAME = 'bus_id' 
    AND TABLE_SCHEMA = DATABASE() 
    LIMIT 1
);

-- Execute drop only if constraint exists
SET @drop_fk_sql = IF(@constraint_name IS NOT NULL, 
    CONCAT('ALTER TABLE trip_instances DROP FOREIGN KEY ', @constraint_name), 
    'SELECT "No foreign key to drop"'
);
PREPARE stmt FROM @drop_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Modify trip_instances columns
-- Check if columns exist before adding (using basic ALTER for simplicity)
-- If you need idempotency, this part is usually handled via migrations or procedures.
ALTER TABLE trip_instances 
    ADD COLUMN IF NOT EXISTS bus_info VARCHAR(255),
    ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 36;

-- Drop the column if it exists
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_NAME = 'trip_instances' 
    AND COLUMN_NAME = 'bus_id' 
    AND TABLE_SCHEMA = DATABASE()
);

SET @drop_col_sql = IF(@col_exists > 0, 
    'ALTER TABLE trip_instances DROP COLUMN bus_id', 
    'SELECT "bus_id already dropped"'
);
PREPARE stmt2 FROM @drop_col_sql;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 3. Drop the redundant buses table
DROP TABLE IF EXISTS buses;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Schema simplification completed successfully' AS Status;
