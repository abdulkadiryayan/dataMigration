
-- emailleri taşıyacağımız tablo
CREATE TABLE email (
	email_id serial PRIMARY KEY,
	email varchar(100) UNIQUE
);

-- customer tablosundaki email'ler email tablosundaki email kolonuna taşınıyor.
INSERT INTO email(email)
SELECT email from customer;


-- email tablosu ile customer tablosu arasında ilişki oluşturma
CREATE TABLE customer_email (
	customer_id int REFERENCES customer(customer_id),
	email_id int REFERENCES email(email_id)
);

-- customer_email tablosuna customer_id ekleyebilmek için email tablosundaki email_id leri customer tablosuna ekleyeceğiz.
INSERT INTO customer_email (customer_id, email_id)
SELECT c.customer_id, e.email_id
FROM customer c
JOIN email e ON c.email = e.email;

-- customer tablosundan email kolonu silinecek ve  V2 ye geçilmiş olacak
ALTER TABLE customer
DROP COLUMN email;





/*
--
insert into email(email)
values  ('abdulkadiryayan@hotmai.com'), 
		('abdulkadiryayan@hotmai.com123');

INSERT INTO customer_email (customer_id, email_id) 
VALUES  (497, 600), 
		(496, 601);
*/


/*
select * from customer
select * from customer_email
select * from email
*/
