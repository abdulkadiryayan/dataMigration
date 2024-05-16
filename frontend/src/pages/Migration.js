import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Migration = () => {
    const [migrationScripts, setMigrationScripts] = useState([]);
    const [selectedScript, setSelectedScript] = useState('');
    const [targetDbConnection, setTargetDbConnection] = useState({
        host: '',
        user: '',
        password: '',
        database: ''
    });

    useEffect(() => {
        axios.get('http://localhost:3000/migration_list')
            .then(response => setMigrationScripts(response.data))
            .catch(error => {
                console.error('Error during migration list:', error);
                if (error.response) {
                    alert('Error during migration list: ' + error.response.data);
                } else {
                    alert('Error during migration list: ' + error.message);
                }
            });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTargetDbConnection({
            ...targetDbConnection,
            [name]: value
        });
    };

    const handleMigrate = () => {
        axios.post('http://localhost:3000/migrate', { source_migrate_file: selectedScript, target_db_connection: targetDbConnection })
            .then(response => alert(response.data))
            .catch(error => {
                console.error('Error during migrate:', error);
                if (error.response) {
                    alert('Error during migrate: ' + error.response.data);
                } else {
                    alert('Error during migrate: ' + error.message);
                }
            });
    };

    return (
        <div>
            <h2>Migration</h2>
            <select onChange={e => setSelectedScript(e.target.value)}>
                <option value="">Select Script</option>
                {migrationScripts.map(script => (
                    <option key={script} value={script}>{script}</option>
                ))}
            </select>
            <input type="text" name="host" placeholder="Host" onChange={handleChange} />
            <input type="text" name="user" placeholder="User" onChange={handleChange} />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} />
            <input type="text" name="database" placeholder="Database" onChange={handleChange} />
            <button onClick={handleMigrate}>Migrate</button>
        </div>
    );
};

export default Migration;
