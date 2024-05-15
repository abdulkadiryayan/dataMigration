const { Client } = require('pg');
const fs = require('fs');

async function applySqlScript(scriptPath, targetDatabase, host, user, password, res) {
    const connectionString = `postgresql://${user}:${password}@${host}:5432/${targetDatabase}`;
    const client = new Client({ connectionString });

    try {
        let sqlScript = fs.readFileSync(scriptPath, 'utf8');
        console.log('SQL script çalıştırılıyor...');

        await client.connect();
        console.log(`Veritabanına bağlandı: ${connectionString}`);
        
        await client.query(sqlScript);
        console.log('SQL script başarıyla çalıştırıldı.');
        res.send('SQL script başarıyla uygulandı.');
        return; // İşlem başarılı, burada fonksiyonu sonlandır
    } catch (err) {
        console.error('Hata:', err);
        if (err.code === 'ENOENT') {
            res.status(404).send('Dosya bulunamadı: Lütfen dosya yolunu kontrol edin.');
        } else {
            res.status(500).send('Veritabanı işlemi sırasında bir hata oluştu: ' + err.message);
        }
        return; // Hata durumunda işlemi burada sonlandır
    } finally {
        if (!res.headersSent) {
            await client.end();
            console.log('Veritabanı bağlantısı sonlandırıldı.');
        }
    }
}

module.exports = { applySqlScript };
