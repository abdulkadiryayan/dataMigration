-- emailleri taşıyacağımız tablo
CREATE TABLE email (
	email_id serial PRIMARY KEY,
	email varchar(100) UNIQUE
);

-- customer tablosundaki email'ler email tablosundaki email kolonuna taşındı.
INSERT INTO email(email)
SELECT email from customer;


-- email tablosu ile customer tablosu arasında ilişki oluşturuldu
CREATE TABLE customer_email (
	customer_id int REFERENCES customer(customer_id),
	email_id int REFERENCES email(email_id)
);

-- customer_email tablosuna customer_id ve email_id atandı.
INSERT INTO customer_email (customer_id, email_id)
SELECT c.customer_id, e.email_id
FROM customer c
JOIN email e ON c.email = e.email;

-- customer tablosundan email kolonu silinerek v2 ye geçildi.
ALTER TABLE customer
DROP COLUMN email;

-- customer_email tablosuna active kolonu eklenerek v1 deki tüm mailler flag lendi.
ALTER TABLE customer_email
ADD COLUMN active BOOLEAN DEFAULT FALSE;

-- v1 deki tüm değerleri flag eklendi
UPDATE customer_email
SET active = TRUE
WHERE customer_id <= 599;

-- örnek veri eklendi
insert into email(email)
values  ('abdulkadiryayan@hotmai.com12'), 
		('abdulkadiryayan@hotmai.com123'),
		('abdulkadiryayan@hotmai.com1234');

INSERT INTO customer_email (customer_id, email_id) 
VALUES  (497, 600), 
		(496, 601),
		(496, 602);

