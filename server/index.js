const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
require('dotenv').config();
const path = require('path');
const { applySqlScript } = require('./sqlScriptFunc');

const app = express();

app.use(cors()); // CORS middleware ekleyin
app.use(express.json());

// Port
const PORT = process.env.PORT || 3000;

// Dosya yolları
const backupsDirectory = './backups/';
const rollbackScriptsDirectory = './scripts/rollback';
const migrationScriptsDirectory = './scripts/migration';

// Backup dosyalarını listeleme endpoint'i
app.get('/backup_list', (req, res) => {
    console.log('Backup list endpoint hit');
    fs.readdir(backupsDirectory, (err, files) => {
        if (err) {
            console.error('Error reading backup directory:', err);
            res.status(500).send('Error reading backup directory');
            return;
        }

        const backupFiles = files.filter(file => path.extname(file) === '.sql');
        console.log('Backup files:', backupFiles);
        res.status(200).json(backupFiles);
    });
});

app.get('/get_script', (req, res) => {
    const { file, type } = req.query;
    const directory = type === 'migration' ? migrationScriptsDirectory : rollbackScriptsDirectory;
    const filePath = path.join(directory, file);

    console.log(`Getting script content: ${filePath}`);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            res.status(500).send('Error reading file: ' + err.message);
            return;
        }
        res.send(data);
    });
});

// Yeni Endpoint: Script İçeriğini Kaydetme
app.post('/save_script', (req, res) => {
    const { fileName, fileContent, fileType } = req.body;
    const directory = fileType === 'migration' ? migrationScriptsDirectory : rollbackScriptsDirectory;
    const filePath = path.join(directory, fileName);

    console.log(`Saving script content: ${filePath}`);

    fs.writeFile(filePath, fileContent, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            res.status(500).send('Error writing file: ' + err.message);
            return;
        }
        res.send('File saved successfully.');
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

    const now = new Date();
    const tarih = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const formattedDate = tarih.toISOString().replace(/:/g, '_').replace(/\..+/, ''); 
    const uniqueFileName = `backup_${formattedDate}.sql`;

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
        if (!err.message.includes=="already exist") {
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
        fs.readdir(migrationScriptsDirectory, (err, files) => {
            if (err) {
                console.error('Error reading migration scripts directory:', err);
                res.status(500).send('Error reading migration scripts directory');
                return;
            }

            const migrationScripts = files.filter(file => path.extname(file) === '.sql');
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
        fs.readdir(rollbackScriptsDirectory, (err, files) => {
            if (err) {
                console.error('Error reading rollback scripts directory:', err);
                res.status(500).send('Error reading rollback scripts directory');
                return;
            }

            const rollbackScripts = files.filter(file => path.extname(file) === '.sql');
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
        const { source_migrate_file } = req.body;
        const { host, user, password, database } = req.body.target_db_connection;
        
        const sqlScriptPathMigrate = `./scripts/migration/` + source_migrate_file;

        // Hata ayıklama logları ekleyin
        console.log('Migration işlemine başlandı');
        console.log('SQL Script Path:', sqlScriptPathMigrate);
        console.log('Database bağlantı bilgileri:', { host, user, password, database });

        await applySqlScript(sqlScriptPathMigrate, database, host, user, password, res);
        
        console.log('Migration işlemi başarıyla tamamlandı');
    } catch (err) {
        console.error('Migration işlemi sırasında hata oluştu:', err);
        res.status(500).send('Migrate işlemi sırasında bir hata oluştu: ' + err.message);
    }
});


// Rollback endpoint'i
app.post('/rollback', async (req, res) => {
    try {
        const { source_rollback_file } = req.body;
        const { host, user, password, database } = req.body.target_db_connection;
        const sqlScriptPathRollback = `./scripts/rollback/` + source_rollback_file;
        await applySqlScript(sqlScriptPathRollback, database, host, user, password,res);
        res.status(200).send(`Rollback işlemi ${database} veritabanı için başarıyla tamamlandı.`);
    } catch (err) {
        console.error(err);
    }
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor, port: ${PORT}`);
});
