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

app.post('/save_script', (req, res) => {
    const { fileName, fileContent, fileType, isNewFile } = req.body;
    const directory = fileType === 'migration' ? migrationScriptsDirectory : rollbackScriptsDirectory;
    const filePath = path.join(directory, fileName);

    if (isNewFile) {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (!err) {
                console.error('File already exists:', filePath);
                res.status(400).send('File already exists');
                return;
            }

            fs.writeFile(filePath, fileContent, 'utf8', (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    res.status(500).send('Error writing file: ' + err.message);
                    return;
                }
                res.send('File created successfully.');
            });
        });
    } else {
        fs.writeFile(filePath, fileContent, 'utf8', (err) => {
            if (err) {
                console.error('Error writing file:', err);
                res.status(500).send('Error writing file: ' + err.message);
                return;
            }
            res.send('File updated successfully.');
        });
    }
});

app.post('/delete_script', (req, res) => {
    const { fileName, fileType } = req.body;
    const directory = fileType === 'migration' ? migrationScriptsDirectory : rollbackScriptsDirectory;
    const filePath = path.join(directory, fileName);

    console.log(`Deleting script: ${filePath}`);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('File not found:', filePath);
            res.status(404).send('File not found');
            return;
        }

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                res.status(500).send('Error deleting file: ' + err.message);
                return;
            }
            console.log('File deleted successfully:', filePath);
            res.send('File deleted successfully.');
        });
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
        if (!err===null && !err.message.includes=="already exist") {
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
    const { from, to, target_db_connection } = req.body;
    const { host, user, password, database } = target_db_connection;
    const scriptPath = path.join(migrationScriptsDirectory, `migration_v${from}_to_v${to}.sql`);

    try {
        console.log(`Migrating from v${from} to v${to} using script: ${scriptPath}`);
        await applySqlScript(scriptPath, database, host, user, password);
        res.send(`Migrated from v${from} to v${to} successfully.`);
    } catch (error) {
        console.error(`Error migrating from v${from} to v${to}:`, error);
        if (!res.headersSent) {
            res.status(500).send(`Error migrating from v${from} to v${to}: ${error.message}`);
        }
    }
});

// Rollback endpoint'i
app.post('/rollback', async (req, res) => {
    const { from, to, target_db_connection } = req.body;
    const { host, user, password, database } = target_db_connection;
    const scriptPath = path.join(rollbackScriptsDirectory, `rollback_v${from}_to_v${to}.sql`);

    try {
        console.log(`Rolling back from v${from} to v${to} using script: ${scriptPath}`);
        await applySqlScript(scriptPath, database, host, user, password);
        res.send(`Rolled back from v${from} to v${to} successfully.`);
    } catch (error) {
        console.error(`Error rolling back from v${from} to v${to}:`, error);
        if (!res.headersSent) {
            res.status(500).send(`Error rolling back from v${from} to v${to}: ${error.message}`);
        }
    }
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor, port: ${PORT}`);
});
