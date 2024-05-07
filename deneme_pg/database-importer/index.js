const { exec } = require('child_process');

let dumpFile = 'dump.sql';	

let exportFrom = {
	host: "localhost",
	user: "postgres",
	password: "1234",
	database: "postgres"
}
let importTo = {
	host: "localhost",
	user: "postgres",
	password: "1234",
	database: "test"
}

console.log(`Veriler ${exportFrom.database} veritabanından dışa aktarılmaya başlanıyor`);

// PostgreSQL Dump komutunu çalıştırıp çıktıyı dumpFile değişkeninde belirtilen dosyaya yönlendirin.

exec(`pg_dump -U ${exportFrom.user} -h ${exportFrom.host} -Fc -f ${dumpFile} ${exportFrom.database}`, (err, stdout, stderr) => {

	if (err) { console.error(`exec error: ${err}`); return; }
	
	console.log(`Şimdi, veriler ${importTo.database} veritabanına aktarılıyor`);
    
	// Veritabanını içe aktarın.
	exec(`pg_restore -U ${importTo.user} -h ${importTo.host} -d ${importTo.database}  ${dumpFile}`, (err, stdout, stderr) => {
        if (err) { console.error(`exec error: ${err}`); return; }

        console.log(`İçe aktarma işlemi tamamlandı.`);
	});

});
