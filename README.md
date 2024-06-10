# DataMigration

Bu proje, veritabanı taşıma süreçlerini kolaylaştırmak için geliştirilmiş kapsamlı bir araçtır. Aşağıdaki işlemler için işlevsel özellikler sunar:

- **Backup List**: Yedeklerimizi görüntüleme imkanı.
- **Veri Tabanı Yedeği Alma (Dump)**: Mevcut veritabanının yedeğini alarak veri kaybı riskini en aza indirme.
- **Yedekten Geri Yükleme (Restore)**: Alınan yedeklerden veritabanını geri yükleme.
- **Veri tabanı version Geçişi (Migration) **: Veritabanı version geçişi yapmaya yarar.
- **Veri tabanında yapılan değişikliği geri alma (Rollback) **: Veri tabanı version'lar arası geri dönmeye yarar.
- **Migrate ve Rollback Script Oluşturma (File Editor)**: Veritabanı yapısını güncellemeye yönelik migrate scriptleri oluşturma ve yapılan değişiklikleri geri almak için rollback scriptleri oluşturma.
- **Config Oluşturma (Config Manager) **: Veri tabanı bağlantı bilgilerini kaydettiğimiz config dosyasıdır.

## Backend, Node.js kullanılarak geliştirilmiştir ve veritabanı işlemleri için SQLite kullanır. Frontend, kullanıcı dostu bir arayüz sağlamak amacıyla React.js ile geliştirilmiştir.

Bu tool'un çalışabilmesi için aşağıdaki yazılımların sisteminizde kurulu olması gerekmektedir:

- **Node.js** (v22 veya üzeri)
- **React.js** (v18 veya üzeri)
- **npm** (Node Package Manager)
- **SQLite** (Veritabanı için)
- **PostgreSQL** (v16 veya üzeri) - **Windows** sistemlerde bu tool'un çalışabilmesi için PostgreSQL'in kurulu olması gerekmektedir.


## Gerekli Kurulumlar ve Uygulamayı Başlatma

1. **Gerekli Kurulumlar**:

   Projeyi çalıştırmadan önce, projenin içerdiği alt dizinlerde gerekli bağımlılıkları kurmanız gerekmektedir.

   - **Veritabanı (Database)**
     - Dizine Gitme: `cd database`
     - Gerekli Modülleri Kurma: `npm install`

   - **Ön Yüz (Frontend)**
     - Dizine Gitme: `cd frontend`
     - Gerekli Modülleri Kurma: `npm install`

   - **Sunucu (Server)**
     - Dizine Gitme: `cd server`
     - Gerekli Modülleri Kurma: `npm install`

2. **Uygulamayı Başlatma**:

   - **Sunucuyu Başlatma**:
     - Sunucu Dizine Gitme: `cd server`
     - Sunucuyu Başlatma: `node index.js`
       - Sunucu `http://localhost:3000` adresinde çalışacaktır.

   - **Ön Yüz Uygulamasını Başlatma**:
     - Ön Yüz Dizine Gitme: `cd frontend`
     - Uygulamayı Başlatma: `npm start`
       - Uygulama otomatik olarak tarayıcınızda `http://localhost:3006` adresinde açılacaktır.
