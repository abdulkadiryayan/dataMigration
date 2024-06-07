const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.sqlite');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Configurations tablosunu oluştur
    db.run(`CREATE TABLE IF NOT EXISTS configurations (
        config_name TEXT PRIMARY KEY,
        host TEXT NOT NULL,
        user TEXT NOT NULL,
        password TEXT NOT NULL,
        database TEXT NOT NULL,
        port TEXT NOT NULL
    )`);

    // Örnek konfigürasyon verilerini ekle
    const insertConfig = db.prepare(`INSERT OR REPLACE INTO configurations (config_name, host, user, password, database, port) VALUES (?, ?, ?, ?, ?, ?)`);

    // Buraya daha fazla konfigürasyon ekleyebilirsiniz
    insertConfig.run('config1', 'localhost', 'postgres', '1234', 'dvdrental2', '5432');
    insertConfig.run('config2', 'localhost', 'postgres', '1234', 'postgres', '5432');
    insertConfig.run('config3', 'localhost', 'postgres', '1234', 'test', '5432');

    insertConfig.finalize();
});

db.close((err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Close the database connection.');
});
