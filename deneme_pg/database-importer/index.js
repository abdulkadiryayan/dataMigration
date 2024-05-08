const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');

// index2.js'den fonksiyonları import etme
const { applySqlScript } = require('./index2');

const app = express();

// Port
const PORT = process.env.PORT || 3000;

// Dosya yolları
const dumpFile = 'C:/Users/Mehmet/Desktop/deneme_pg/database-importer/dump.sql';

const sqlScriptPathMigrate = 'C:/Users/Mehmet/Downloads/migration_v1_to_v2.sql';
const sqlScriptPathRollback = 'C:/Users/Mehmet/Downloads/rollback_v2_to_v1.sql';

// Veritabanı bağlantı bilgileri
const exportFrom = {
    host: "localhost",
    user: "postgres",
    password: "1234",
    database: "postgres"
};

const importTo = {
    host: "localhost",
    user: "postgres",
    password: "1234",
    database: "test3"
};

// Dump endpoint'i
app.post('/dump', (req, res) => {
    console.log(`Veriler ${exportFrom.database} veritabanından dışa aktarılmaya başlanıyor`);

    exec(`pg_dump -U ${exportFrom.user} -h ${exportFrom.host} -Fc -f ${dumpFile} ${exportFrom.database}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            res.status(500).send('Veri dışa aktarma işlemi sırasında bir hata oluştu. ' + err);
            return;
        }

        console.log(`Dışa aktarma işlemi tamamlandı.`);
        res.status(200).sendFile(dumpFile);
    });
});

// Restore endpoint'i
app.post('/restore', (req, res) => {
    console.log(`Şimdi, veriler ${importTo.database} veritabanına aktarılıyor`);

    exec(`pg_restore --if-exists=append --clean -U ${importTo.user} -h ${importTo.host} -d ${importTo.database}  ${dumpFile}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            res.status(500).send('Veri içe aktarma işlemi sırasında bir hata oluştu. ' + err);
            return;
        }

        console.log(`İçe aktarma işlemi tamamlandı.`);
        res.status(200).send('İçe aktarma işlemi başarıyla tamamlandı.');
    });
});

// Migrate endpoint'i
app.post('/migrate', async (req, res) => {
    try {
        await applySqlScript(sqlScriptPathMigrate);
        res.status(200).send('Migrate işlemi başarıyla tamamlandı.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Migrate işlemi sırasında bir hata oluştu.');
    }
});

// Rollback endpoint'i
app.post('/rollback', async (req, res) => {
    try {
        await applySqlScript(sqlScriptPathRollback);
        res.status(200).send('Rollback işlemi başarıyla tamamlandı.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Rollback işlemi sırasında bir hata oluştu.');
    }
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor, port: ${PORT}`);
});
