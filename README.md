# dataMigration

Dvd rental veri tabanın da customer tablosu içerisinde one to one ilişkisi üzerinden çalışan email kolonunu yeni bir tablo oluşturup customer tablosundaki tüm verileri email tablosuna taşıdık.
Taşıdığımız verileri customer_email tablosu oluşturup arasında customer ile ilişkilendirdik.
Customer tablosunda email kolonunu sildiğimizde ise artık v2 ye geçmiş olduk.
Örnek veriler eklenip istenilen koşullara uygun bir biçimde v1 e döndük.

Yukarıda belirtilen migrate ve rollback sürecinde yazmış olduğumuz migrate ve rollback scriptlerini de klasör ekledik.
