import axios from 'axios';

export const compareVersions = (version1, version2) => {
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

export const fetchScriptsBetweenVersions = async (scriptType, fromVersion, toVersion) => {
    try {
        const response = await axios.get(`http://localhost:3000/${scriptType}_list`);
        const scripts = response.data.filter(script => {
            const version = script.match(/\d+(\.\d+)+/)[0]; // Extract version from the script name
            return compareVersions(version, fromVersion) > 0 && compareVersions(version, toVersion) <= 0;
        });

        scripts.sort((a, b) => compareVersions(a.match(/\d+(\.\d+)+/)[0], b.match(/\d+(\.\d+)+/)[0]));

        return scripts;
    } catch (error) {
        console.error("Error fetching or sorting scripts:", error);
        throw new Error("Error fetching or sorting scripts");
    }
};
