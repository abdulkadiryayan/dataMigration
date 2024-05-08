const express = require('express');
const { exec } = require('child_process');

const app = express();
const dumpFile = 'C:/Users/Mehmet/Desktop/deneme_pg/database-importer/dump.sql';

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
app.get('/dump', (req, res) => {
    console.log(`Veriler ${exportFrom.database} veritabanından dışa aktarılmaya başlanıyor`);

    exec(`pg_dump -U ${exportFrom.user} -h ${exportFrom.host} -Fc -f ${dumpFile} ${exportFrom.database}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            res.status(500).send('Veri dışa aktarma işlemi sırasında bir hata oluştu.');
            return;
        }

        console.log(`Dışa aktarma işlemi tamamlandı.`);
        res.status(200).sendFile(dumpFile);
    });
});

// Restore endpoint'i
app.get('/restore', (req, res) => {
    console.log(`Şimdi, veriler ${importTo.database} veritabanına aktarılıyor`);

    exec(`pg_restore -U ${importTo.user} -h ${importTo.host} -d ${importTo.database}  ${dumpFile}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            res.status(500).send('Veri içe aktarma işlemi sırasında bir hata oluştu.');
            return;
        }

        console.log(`İçe aktarma işlemi tamamlandı.`);
        res.status(200).send('İçe aktarma işlemi başarıyla tamamlandı.');
    });
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor, port: ${PORT}`);
});
