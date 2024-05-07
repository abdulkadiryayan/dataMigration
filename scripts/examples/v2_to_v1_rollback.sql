-- customer tablosuna email kolonu eklendi
ALTER TABLE customer
ADD COLUMN email VARCHAR(50);


SELECT ce.customer_id, ce.email_id, e.email
FROM customer_email ce
JOIN email e ON ce.email_id = e.email_id;


UPDATE customer c
SET email = e.email
FROM email e
JOIN customer_email ce ON e.email_id = ce.email_id
WHERE ce.customer_id = c.customer_id;

/*
select *
FROM email e
JOIN customer_email ce ON e.email_id = ce.email_id
order by 3; */


-- email ve customer_email tablolarını sil ve customer daki email_id kolonunu sil
DROP TABLE customer_email;
DROP TABLE email;

/*
select * from customer
select * from customer_email
select * from email
*/
