import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Rollback = () => {
    const [rollbackScripts, setRollbackScripts] = useState([]);
    const [selectedScript, setSelectedScript] = useState('');
    const [targetDbConnection, setTargetDbConnection] = useState({
        host: '',
        user: '',
        password: '',
        database: ''
    });

    useEffect(() => {
        axios.get('http://localhost:3000/rollback_list')
            .then(response => setRollbackScripts(response.data))
            .catch(error => console.error('Error fetching rollback scripts:', error));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTargetDbConnection({
            ...targetDbConnection,
            [name]: value
        });
    };

    const handleRollback = () => {
        axios.post('http://localhost:3000/rollback', { source_rollback_file: selectedScript, target_db_connection: targetDbConnection })
            .then(response => alert(response.data))
            .catch(error => alert('Error during rollback:', error));
    };

    return (
        <div>
            <h2>Rollback</h2>
            <select onChange={e => setSelectedScript(e.target.value)}>
                <option value="">Select Script</option>
                {rollbackScripts.map(script => (
                    <option key={script} value={script}>{script}</option>
                ))}
            </select>
            <input type="text" name="host" placeholder="Host" onChange={handleChange} />
            <input type="text" name="user" placeholder="User" onChange={handleChange} />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} />
            <input type="text" name="database" placeholder="Database" onChange={handleChange} />
            <button onClick={handleRollback}>Rollback</button>
        </div>
    );
};

export default Rollback;
