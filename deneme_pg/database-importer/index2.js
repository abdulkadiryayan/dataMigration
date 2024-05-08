const express = require('express');
const { Client } = require('pg');
const fs = require('fs');

const app = express();
const connectionString = 'postgresql://postgres:1234@localhost:5432/test3';

const sqlScriptPathMigrate = 'C:/Users/Mehmet/Downloads/migration_v1_to_v2.sql';
const sqlScriptPathRollback = 'C:/Users/Mehmet/Downloads/rollback_v2_to_v1.sql';

async function applySqlScript(scriptPath) {
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log(`Veritabanına bağlandı: ${connectionString}`);

        const sqlScript = fs.readFileSync(scriptPath, 'utf8');
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

// Migrate endpoint'i
app.get('/migrate', async (req, res) => {
    try {
        await applySqlScript(sqlScriptPathMigrate);
        res.status(200).send('Migrate işlemi başarıyla tamamlandı.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Migrate işlemi sırasında bir hata oluştu.');
    }
});

// Rollback endpoint'i
app.get('/rollback', async (req, res) => {
    try {
        await applySqlScript(sqlScriptPathRollback);
        res.status(200).send('Rollback işlemi başarıyla tamamlandı.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Rollback işlemi sırasında bir hata oluştu.');
    }
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor, port: ${PORT}`);
});
