const { exec } = require('child_process');

const applySqlScript = (scriptPath, database, host, user, password) => {
    return new Promise((resolve, reject) => {
        const command = `psql -h ${host} -U ${user} -d ${database} -f ${scriptPath} --set ON_ERROR_STOP=on`;
        exec(command, { env: { PGPASSWORD: password } }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing SQL script: ${stderr}`);
                reject(new Error(stderr));
            } else if (stderr) {
                console.error(`SQL script error: ${stderr}`);
                reject(new Error(stderr));
            } else {
                console.log(`SQL script executed successfully: ${stdout}`);
                resolve(stdout);
            }
        });
    });
};

module.exports = { applySqlScript };
