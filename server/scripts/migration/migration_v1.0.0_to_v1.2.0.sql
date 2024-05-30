-- Migration script from version 1.0.0 to 1.2.0
ALTER TABLE customer
ADD COLUMN ball VARCHAR(10);