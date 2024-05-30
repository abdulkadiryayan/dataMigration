const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const { applySqlScript } = require('./sqlScriptFunc');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const sqliteDb = new sqlite3.Database(path.join(__dirname, '../database/db.sqlite'));

const getPostgresConfig = (configName) => {
    return new Promise((resolve, reject) => {
        sqliteDb.get("SELECT * FROM configurations WHERE config_name = ?", [configName], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

let pools = {};

const initializePostgresConnections = async () => {
    const configNames = ['config1', 'config2','config3']; // Eklediğiniz tüm konfigürasyon isimlerini buraya ekleyin
    for (const configName of configNames) {
        const config = await getPostgresConfig(configName);
        pools[configName] = new Pool({
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database,
            port: config.port
        });
    }
};

initializePostgresConnections().catch(err => {
    console.error('Error initializing PostgreSQL connection:', err);
    process.exit(1);
});

// Dosya yolları
const backupsDirectory = './backups/';
const rollbackScriptsDirectory = './scripts/rollback';
const migrationScriptsDirectory = './scripts/migration';

const fileExists = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                reject(new Error(`File not found: ${filePath}`));
            } else {
                resolve(true);
            }
        });
    });
};

const checkAllFilesExist = async (filePaths) => {
    for (const filePath of filePaths) {
        await fileExists(filePath);
    }
};

// Endpoint to get the current version from PostgreSQL
app.get('/current_version', async (req, res) => {
    const { configName } = req.query;
    try {
        const result = await pools[configName].query('SELECT version_number FROM version ORDER BY id DESC LIMIT 1');
        res.json(result.rows[0].version_number);
    } catch (err) {
        console.error('Error fetching current version:', err);
        res.status(500).send('Error fetching current version');
    }
});

// Endpoint to get PostgreSQL configurations from SQLite
app.get('/configurations', async (req, res) => {
    sqliteDb.all("SELECT DISTINCT config_name FROM configurations", (err, rows) => {
        if (err) {
            console.error('Error fetching configurations:', err);
            res.status(500).send('Error fetching configurations');
        } else {
            res.json(rows);
        }
    });
});

// Endpoint to get configuration details from SQLite
app.get('/config_details', async (req, res) => {
    const { configKey } = req.query;
    sqliteDb.get("SELECT * FROM configurations WHERE config_name = ?", [configKey], (err, row) => {
        if (err) {
            console.error('Error fetching configuration details:', err);
            res.status(500).send('Error fetching configuration details');
        } else {
            res.json(row);
        }
    });
});

app.post('/check_migration_files', async (req, res) => {
    const { from, to } = req.body;
    const scriptPath = path.join(migrationScriptsDirectory, `migration_v${from}_to_v${to}.sql`);

    try {
        await fileExists(scriptPath);
        res.send({ success: true });
    } catch (error) {
        res.send({ success: false, message: error.message });
    }
});

app.post('/check_rollback_files', async (req, res) => {
    const { from, to } = req.body;
    const scriptPath = path.join(rollbackScriptsDirectory, `rollback_v${from}_to_v${to}.sql`);

    try {
        await fileExists(scriptPath);
        res.send({ success: true });
    } catch (error) {
        res.send({ success: false, message: error.message });
    }
});

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
    const { source_backup_file, target_db_connection,fullRestore } = req.body;
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

    let restoreCommand;

    if(fullRestore) {
        restoreCommand = `
            dropdb ${importCon} &&
            createdb ${importCon} &&
            pg_restore -c -d ${importCon} ${backupFilePath}
        `;
        res.status(200).send('Database dropped and created again')
    }else{
        restoreCommand = `pg_restore --data-only -d ${importCon} ${backupFilePath}`;
        res.status(200).send('Data only executed')
    }


    exec(restoreCommand, (err, stdout, stderr) => {
        if (!err===null && !err.message.includes=="already exist") {
            console.error(`exec error: ${err}`);
            res.status(500).send('Veri içe aktarma işlemi sırasında bir hata oluştu. ' + err);
            return;
        }

        console.log(`İçe aktarma işlemi tamamlandı.`);
        
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
    const { from, to, target_db_connection, configName } = req.body;
    const { host, user, password, database } = target_db_connection;
    const scriptPath = path.join(migrationScriptsDirectory, `migration_v${from}_to_v${to}.sql`);
    const pool = pools[configName];

    if (!pool) {
        return res.status(404).send(`No pool found for config: ${configName}`);
    }

    try {
        await fileExists(scriptPath);
        console.log(`Migrating using script: ${scriptPath}`);
        await applySqlScript(scriptPath, database, host, user, password);
        await pool.query('INSERT INTO version (version_number) VALUES ($1)', [to]);
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
    const { from, to, target_db_connection, configName } = req.body;
    const { host, user, password, database } = target_db_connection;
    const scriptPath = path.join(rollbackScriptsDirectory, `rollback_v${from}_to_v${to}.sql`);
    const pool = pools[configName];

    if (!pool) {
        return res.status(404).send(`No pool found for config: ${configName}`);
    }

    try {
        await fileExists(scriptPath);
        console.log(`Rolling back using script: ${scriptPath}`);
        await applySqlScript(scriptPath, database, host, user, password);
        await pool.query('INSERT INTO version (version_number) VALUES ($1)', [to]);
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
