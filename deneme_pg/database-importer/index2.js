const express = require('express');
const { Client } = require('pg');
const fs = require('fs');

const app = express();
const connectionString = 'postgresql://postgres:1234@localhost:5432/test';
//const sqlScriptPath = 'C:/Users/Mehmet/Downloads/rollback_v2_to_v1.sql';
const sqlScriptPath = 'C:/Users/Mehmet/Downloads/migration_v1_to_v2.sql';

async function applySqlScript() {
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log(`Veritabanına bağlandı: ${connectionString}`);

        const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');
        console.log('SQL script çalıştırılıyor...');
        await client.query(sqlScript);
        console.log('SQL script başarıyla çalıştırıldı.');
    } catch (err) {
        console.error('Hata:', err);
    } finally {
        await client.end();
        console.log('Veritabanı bağlantısı sonlandırıldı.');
    }
}

// apply-script endpoint'i
app.post('/apply-script', async (req, res) => {
    try {
        await applySqlScript();
        res.status(200).send('SQL script başarıyla çalıştırıldı.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Bir hata oluştu.');
    }
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor, port: ${PORT}`);
});
