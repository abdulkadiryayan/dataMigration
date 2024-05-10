const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
require('dotenv').config();

// index2.js'den fonksiyonları import etme
const { applySqlScript } = require('./index2');

const app = express();

// Port
const PORT = process.env.PORT || 3000;

// Dosya yolları
const dumpFile = './backups/dump.sql';

const sqlScriptPathMigrate = 'C:/Users/Mehmet/Downloads/migration_v1_to_v2.sql';
const sqlScriptPathRollback = 'C:/Users/Mehmet/Downloads/rollback_v2_to_v1.sql';

// Veritabanı bağlantı bilgileri
const exportFrom = {
    host: "localhost",
    user: "postgres",
    password: process.env.pass,
    database: "postgres"
};

const exportCon = `postgresql://${exportFrom.user}:${exportFrom.password}@${exportFrom.host}:5432/${exportFrom.database}`;

const importTo = {
    host: "localhost",
    user: "postgres",
    password: process.env.pass,
    database: "test3"
};

const importCon = `postgresql://${importTo.user}:${importTo.password}@${importTo.host}:5432/${importTo.database}`;

// Dump endpoint'i
app.post('/dump', (req, res) => {
    console.log(`Veriler ${exportFrom.database} veritabanından dışa aktarılmaya başlanıyor`);

    exec(`pg_dump -Fc ${exportCon} > ${dumpFile}`, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            res.status(500).send('Veri dışa aktarma işlemi sırasında bir hata oluştu. ' + err);
            return;
        }

        console.log("Dışa aktarma işlemi tamamlandı.")
        res.status(200).send(`Dışa aktarma işlemi tamamlandı.`);
        //res.status(200).sendFile(dumpFile);
    });
});

// Restore endpoint'i
app.post('/restore', (req, res) => {
    console.log(`Veriler ${importTo.database} veritabanına aktarılıyor`);

    exec(`pg_restore --if-exists=append -c -d ${importCon} ${dumpFile}`, (err, stdout, stderr) => {
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
