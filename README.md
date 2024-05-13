# dataMigration

Migration script:
Dvd rental veri tabanın da customer tablosu içerisinde one to one ilişkisi üzerinden çalışan email kolonunu yeni bir email tablosu oluşturup customer tablosundaki tüm verileri email tablosuna taşıyarak one to many ilişkili sisteme geçildi.
Taşıdığımız verileri customer_email tablosu oluşturup customer ile ilişki kuruldu.
Customer tablosunda email kolonunu sildiğimizde ise artık v2'ye geçmiş olundu.

Rollback script:
Customer tablosuna email kolonu eklenip email tablosundaki email'ler customer tablosundaki email kolonuna taşındı.
Customer_email ve email tablosu silinip v1'e dönülür.
