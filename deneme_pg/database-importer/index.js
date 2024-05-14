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
const rollbackScriptsDirectory = './scripts/rollback';
const migrationScriptsDirectory = './scripts/migration';


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

    const exportCon = `postgresql://${exportFrom.user}:${exportFrom.password}@${exportFrom.host}:5432/${exportFrom.database}`;

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

    const importCon = `postgresql://${importTo.user}:${importTo.password}@${importTo.host}:5432/${importTo.database}`;
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

// Migration list endpoint'i
app.get('/migration_list', (req, res) => {
    try {
        // Migrate scriptlerinin bulunduğu dizini oku
        fs.readdir(migrationScriptsDirectory, (err, files) => {
            if (err) {
                console.error('Error reading migration scripts directory:', err);
                res.status(500).send('Error reading migration scripts directory');
                return;
            }

            // Sadece .sql uzantılı dosyaları filtreleme
            const migrationScripts = files.filter(file => path.extname(file) === '.sql');

            // Script listesini istemciye gönderme
            res.status(200).json(migrationScripts);
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('An error occurred while fetching migration scripts.');
    }
});

// Rollback list endpoint'i
app.get('/rollback_list', (req, res) => {
    try {
        // Rollback scriptlerinin bulunduğu dizini oku
        fs.readdir(rollbackScriptsDirectory, (err, files) => {
            if (err) {
                console.error('Error reading rollback scripts directory:', err);
                res.status(500).send('Error reading rollback scripts directory');
                return;
            }

            // Sadece .sql uzantılı dosyaları filtreleme
            const rollbackScripts = files.filter(file => path.extname(file) === '.sql');

            // Script listesini istemciye gönderme
            res.status(200).json(rollbackScripts);
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('An error occurred while fetching rollback scripts.');
    }
});


// Migrate endpoint'i
app.post('/migrate', async (req, res) => {
    try {
        const { host, user, password, database } = req.body.target_db_connection;
        const sqlScriptPathMigrate = `./scripts/migration/migration_v1_to_v2.sql`;
        await applySqlScript(sqlScriptPathMigrate, database, host, user, password);
        res.status(200).send(`Migrate işlemi ${database} veritabanı için başarıyla tamamlandı.`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Migrate işlemi sırasında bir hata oluştu.');
    }
});

// Rollback endpoint'i
app.post('/rollback', async (req, res) => {
    try {
        const { host, user, password, database } = req.body.target_db_connection;
        const sqlScriptPathRollback = `./scripts/rollback/rollback_v2_to_v1.sql`;
        await applySqlScript(sqlScriptPathRollback, database, host, user, password);
        res.status(200).send(`Rollback işlemi ${database} veritabanı için başarıyla tamamlandı.`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Rollback işlemi sırasında bir hata oluştu.');
    }
});



// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor, port: ${PORT}`);
});
