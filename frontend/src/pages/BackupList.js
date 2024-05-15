import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BackupList = () => {
    const [backups, setBackups] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:3000/backup_list')
            .then(response => setBackups(response.data))
            .catch(error => console.error('Error fetching backup list:', error));
    }, []);

    return (
        <div>
            <h2>Backup List</h2>
            <ul>
                {backups.map(backup => (
                    <li key={backup}>{backup}</li>
                ))}
            </ul>
        </div>
    );
};

export default BackupList;
