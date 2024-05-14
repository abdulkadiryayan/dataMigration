-- v2 to v1 rollback
-- customer tablosuna email kolonu tekrar eklendi
ALTER TABLE customer
ADD COLUMN email VARCHAR(50);


-- customer_email tablosu ile email tablosu email_id üzerinden birleştirildi.
-- customer_id ve email_id ler eşleştirilip TRUE değerler oluşturduğumuz email kolonuna atandı.
UPDATE customer c
SET email = e.email
FROM email e
JOIN customer_email ce ON e.email_id = ce.email_id
WHERE ce.customer_id = c.customer_id AND ce.active = TRUE;

-- email ve customer_email tablolarını silip v1 e geçtik.
DROP TABLE customer_email;
DROP TABLE email;