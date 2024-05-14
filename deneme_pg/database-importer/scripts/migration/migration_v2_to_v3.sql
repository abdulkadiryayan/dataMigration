-- migration_v2_to_v3

-- customer tablosuna cinsiyet kolonu eklendi.
ALTER TABLE customer 
ADD COLUMN gender VARCHAR(10);

-- 2 örnek customer eklendi.
INSERT INTO customer (store_id, first_name, last_name, address_id, activebool, create_date, last_update, active, gender)
VALUES  (1, 'ahmet ', 'bardız', 1, true, now(), now(), 1, 'erkek'),
		(2, 'abdulakdir ', 'yayan', 1, true, now(), now(), 1, 'erkek');