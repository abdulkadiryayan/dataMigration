const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres:1234@localhost:5432/test3';

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

module.exports = { applySqlScript };
