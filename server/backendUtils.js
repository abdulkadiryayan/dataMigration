const fs = require('fs');
const path = require('path');

const migrationScriptsDirectory = './scripts/migration';
const rollbackScriptsDirectory = './scripts/rollback';

const compareVersions = (version1, version2) => {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);
    const length = Math.max(v1.length, v2.length);

    for (let i = 0; i < length; i++) {
        const num1 = v1[i] || 0;
        const num2 = v2[i] || 0;

        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }

    return 0;
};

const fetchScriptsBetweenVersions = async (scriptType, fromVersion, toVersion) => {
    const directory = scriptType === 'migration' ? migrationScriptsDirectory : rollbackScriptsDirectory;
    const scripts = fs.readdirSync(directory).filter(file => path.extname(file) === '.sql');

    console.log(`Scripts found in ${directory}:`, scripts);

    const filteredScripts = scripts.filter(script => {
        const version = script.match(/\d+(\.\d+)+/)[0];
        return compareVersions(version, fromVersion) > 0 && compareVersions(version, toVersion) <= 0;
    });

    console.log(`Filtered scripts between ${fromVersion} and ${toVersion}:`, filteredScripts);

    if (scriptType === 'rollback') {
        filteredScripts.sort((a, b) => compareVersions(b.match(/\d+(\.\d+)+/)[0], a.match(/\d+(\.\d+)+/)[0])); // Reverse order for rollback
    } else {
        filteredScripts.sort((a, b) => compareVersions(a.match(/\d+(\.\d+)+/)[0], b.match(/\d+(\.\d+)+/)[0])); // Normal order for migration
    }

    return filteredScripts;
};

module.exports = {
    fetchScriptsBetweenVersions,
    compareVersions
};
