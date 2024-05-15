import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Restore = () => {
    const [backupFiles, setBackupFiles] = useState([]);
    const [selectedBackup, setSelectedBackup] = useState('');
    const [targetDbConnection, setTargetDbConnection] = useState({
        host: '',
        user: '',
        password: '',
        database: ''
    });

    useEffect(() => {
        axios.get('http://localhost:3000/backup_list')
            .then(response => setBackupFiles(response.data))
            .catch(error => console.error('Error fetching backup list:'+ error));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTargetDbConnection({
            ...targetDbConnection,
            [name]: value
        });
    };

    const handleRestore = () => {
        axios.post('http://localhost:3000/restore', { source_backup_file: selectedBackup, target_db_connection: targetDbConnection })
            .then(response => alert(response.data))
            .catch(error => {
                console.error('Error during restore:', error);
                if (error.response) {
                    alert('Error during restore: ' + error.response.data);
                } else {
                    alert('Error during restore: ' + error.message);
                }
            });
    };

    return (
        <div>
            <h2>Restore</h2>
            <select onChange={e => setSelectedBackup(e.target.value)}>
                <option value="">Select Backup</option>
                {backupFiles.map(file => (
                    <option key={file} value={file}>{file}</option>
                ))}
            </select>
            <input type="text" name="host" placeholder="Host" onChange={handleChange} />
            <input type="text" name="user" placeholder="User" onChange={handleChange} />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} />
            <input type="text" name="database" placeholder="Database" onChange={handleChange} />
            <button onClick={handleRestore}>Restore</button>
        </div>
    );
};

export default Restore;
