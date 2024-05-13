const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
require('dotenv').config();
const path = require('path'); // path modülünü ekleyin


const { applySqlScript } = require('./index2'); // index2.js'den fonksiyonları import etme

const app = express();

app.use(express.json()); // JSON verilerini işlemeye yarar

// Port
const PORT = process.env.PORT || 3000;

// Dosya yolları
const backupsDirectory = './backups/';


const sqlScriptPathMigrate = './scripts/examples/migration_v1_to_v2.sql';
const sqlScriptPathRollback = './scripts/examples/rollback_v2_to_v1.sql';

// Backup dosyalarını listeleme endpoint'i
app.get('/backup_list', (req, res) => {
    fs.readdir(backupsDirectory, (err, files) => {
        if (err) {
            console.error('Error reading backup directory:', err);
            res.status(500).send('Error reading backup directory');
            return;
        }

        // Sadece .sql uzantılı dosyaları filtreleme
        const backupFiles = files.filter(file => path.extname(file) === '.sql');

        // Dosya listesini istemciye gönderme
        res.status(200).json(backupFiles);
    });
});

// Dump endpoint'i
app.post('/dump', (req, res) => {
    const { target_db_connection } = req.body;
    const { host, user, password, database } = target_db_connection;

    const exportFrom = {
        host: host,
        user: user,
        password: password,
        database: database
    };

    const exportCon = `postgresql://${exportFrom.user}:${process.env.PGPASSWORD}@${exportFrom.host}:5432/${exportFrom.database}`;

    const uniqueFileName = `backup_${new Date().toISOString().replace(/:/g, '_').replace(/\..+/, '')}.sql`;
    const dumpFilePath = backupsDirectory + uniqueFileName;

    console.log(`Veriler ${exportFrom.database} veritabanından dışa aktarılarak ${uniqueFileName} dosyasına kaydediliyor`);

    exec(`pg_dump -Fc ${exportCon} > ${dumpFilePath}`, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            res.status(500).send('Veriyi dışa aktarma işlemi sırasında bir hata oluştu. ' + err);
            return;
        }

        console.log("Dışa aktarma işlemi tamamlandı.")
        res.status(200).send(`Dışa aktarma işlemi tamamlandı ve ${uniqueFileName} dosyasına kaydedildi.`);
    });
});

// Restore endpoint'i
app.post('/restore', (req, res) => {
    const { source_backup_file, target_db_connection } = req.body;
    const { host, user, password, database } = target_db_connection;

    const importTo = {
        host: host,
        user: user,
        password: password,
        database: database
    };

    const importCon = `postgresql://${importTo.user}:${process.env.PGPASSWORD}@${importTo.host}:5432/${importTo.database}`;
    const backupFilePath = backupsDirectory + source_backup_file;

    console.log(`Veriler ${importTo.database} veritabanına aktarılıyor`);

    exec(`pg_restore --if-exists=append -c -d ${importCon} ${backupFilePath}`, (err, stdout, stderr) => {
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
        const { target_database } = req.body; // Hedef veritabanını istek gövdesinden al
        const sqlScriptPathMigrate = `./scripts/examples/migration_v1_to_v2.sql`; // Hedef veritabanına sql  yolu
        await applySqlScript(sqlScriptPathMigrate); // SQL script i hedef veritabanına uygula
        res.status(200).send(`Migrate işlemi ${target_database} veritabanı için başarıyla tamamlandı.`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Migrate işlemi sırasında bir hata oluştu.');
    }
});

// Rollback endpoint'i
app.post('/rollback', async (req, res) => {
    try {
        const { target_database, backup_file } = req.body; // Hedef veritabanını ve geri alınacak yedeği istek al
        const sqlScriptPathRollback = `./scripts/examples/rollback_v2_to_v1.sql`; // Hedef veritabanına özgü geri alma SQL script yolu
        await applySqlScript(sqlScriptPathRollback); // Geri alma SQL script hedef veritabanına uygula
        res.status(200).send(`Rollback işlemi ${target_database} veritabanı için başarıyla tamamlandı. Seçilen yedek: ${backup_file}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Rollback işlemi sırasında bir hata oluştu.');
    }
});


// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor, port: ${PORT}`);
});
