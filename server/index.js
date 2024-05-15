const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const { Client } = require('pg');
const path = require('path');
require('dotenv').config();
<<<<<<< HEAD:server/index.js
const path = require('path'); // path modülünü ekleyin


const { applySqlScript } = require('./sqlScriptFunc'); // index2.js'den fonksiyonları import etme
=======
>>>>>>> abdulkadir:deneme_pg/database-importer/index.js

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const backupsDirectory = './backups/';
const rollbackScriptsDirectory = './scripts/rollback';
const migrationScriptsDirectory = './scripts/migration';

async function applySqlScript(scriptPath, targetDatabase, host, user, password, res) {
    const connectionString = `postgresql://${user}:${password}@${host}:5432/${targetDatabase}`;
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
        res.status(500).send(`${err.message}`);
    } finally {
        await client.end();
        console.log('Veritabanı bağlantısı sonlandırıldı.');
    }
}

app.get('/backup_list', (req, res) => {
    fs.readdir(backupsDirectory, (err, files) => {
        if (err) {
            console.error('Backup dizini okunurken hata oluştu:', err);
            res.status(500).send('Backup dizini okunurken hata oluştu');
            return;
        }

        const backupFiles = files.filter(file => path.extname(file) === '.sql');
        res.status(200).json(backupFiles);
    });
});

app.post('/dump', (req, res) => {
    const { target_db_connection } = req.body;
    const { host, user, password, database } = target_db_connection;

    const exportFrom = { host, user, password, database };
    const exportCon = `postgresql://${exportFrom.user}:${exportFrom.password}@${exportFrom.host}:5432/${exportFrom.database}`;

    const now = new Date();
    const tarih = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const formattedDate = tarih.toISOString().replace(/:/g, '_').replace(/\..+/, ''); 
    const uniqueFileName = `backup_${formattedDate}.sql`;
<<<<<<< HEAD:server/index.js

    
=======
>>>>>>> abdulkadir:deneme_pg/database-importer/index.js
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

app.post('/restore', (req, res) => {
    const { source_backup_file, target_db_connection } = req.body;
    const { host, user, password, database } = target_db_connection;

    const importTo = { host, user, password, database };
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

app.get('/migration_list', (req, res) => {
    fs.readdir(migrationScriptsDirectory, (err, files) => {
        if (err) {
            console.error('Migrate scriptlerinin bulunduğu dizini okunurken hata oluştu:', err);
            res.status(500).send('Migrate scriptlerinin bulunduğu dizini okunurken hata oluştu');
            return;
        }

        const migrationScripts = files.filter(file => path.extname(file) === '.sql');
        res.status(200).json(migrationScripts);
    });
});

app.get('/rollback_list', (req, res) => {
    fs.readdir(rollbackScriptsDirectory, (err, files) => {
        if (err) {
            console.error('Rollback scriptlerinin bulunduğu dizini okunurken hata oluştu:', err);
            res.status(500).send('Rollback scriptlerinin bulunduğu dizini okunurken hata oluştu');
            return;
        }

        const rollbackScripts = files.filter(file => path.extname(file) === '.sql');
        res.status(200).json(rollbackScripts);
    });
});

<<<<<<< HEAD:server/index.js
// Migrate endpoint'i
=======
>>>>>>> abdulkadir:deneme_pg/database-importer/index.js
app.post('/migrate', async (req, res) => {
    try {
        const { source_migrate_file } = req.body;
        const { host, user, password, database } = req.body.target_db_connection;
        
        const sqlScriptPathMigrate = `./scripts/migration/` + source_migrate_file;
<<<<<<< HEAD:server/index.js
        await applySqlScript(sqlScriptPathMigrate, database, host, user, password, res);
        
=======
        const scriptExists = fs.existsSync(sqlScriptPathMigrate);

        if (!scriptExists) {
            throw new Error(`Migrate işlemi için belirtilen dosya mevcut değil: ${source_migrate_file}`);
        }

        await applySqlScript(sqlScriptPathMigrate, database, host, user, password, res);
        res.status(200).send(`Migrate işlemi ${database} veritabanı için başarıyla tamamlandı.`);
>>>>>>> abdulkadir:deneme_pg/database-importer/index.js
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message); // 400 Bad Request
    }
});

app.post('/rollback', async (req, res) => {
    try {
        const { source_rollback_file } = req.body;
        const { host, user, password, database } = req.body.target_db_connection;
        const sqlScriptPathRollback = `./scripts/rollback/` + source_rollback_file;
<<<<<<< HEAD:server/index.js
        await applySqlScript(sqlScriptPathRollback, database, host, user, password,res);
        res.status(200).send(`Rollback işlemi ${database} veritabanı için başarıyla tamamlandı.`);
    } catch (err) {
        console.error(err);
    }
});

// Sunucuyu başlat
=======
        const scriptExists = fs.existsSync(sqlScriptPathRollback);

        if (!scriptExists) {
            throw new Error(`Rollback işlemi için belirtilen dosya mevcut değil: ${source_rollback_file}`);
        }

        await applySqlScript(sqlScriptPathRollback, database, host, user, password, res);
        res.status(200).send(`Rollback işlemi ${database} veritabanı için başarıyla tamamlandı.`);
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message); // 400 Bad Request
    }
});




>>>>>>> abdulkadir:deneme_pg/database-importer/index.js
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor, port: ${PORT}`);
});
