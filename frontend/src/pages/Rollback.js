import React, { useState } from 'react';
import axios from 'axios';

const Rollback = () => {
    const [fromVersion, setFromVersion] = useState(2);
    const [toVersion, setToVersion] = useState(1);
    const [targetDbConnection, setTargetDbConnection] = useState({
        host: '',
        user: '',
        password: '',
        database: ''
    });
    const [errorMessage, setErrorMessage] = useState(''); // Yeni eklendi

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTargetDbConnection({
            ...targetDbConnection,
            [name]: value
        });
    };

    const handleRollback = async () => {
        setErrorMessage(''); // Yeni eklendi
        for (let version = fromVersion; version > toVersion; version--) {
            const nextVersion = version - 1;
            try {
                await axios.post('http://localhost:3000/rollback', {
                    from: version,
                    to: nextVersion,
                    target_db_connection: targetDbConnection
                });
                alert(`Successfully rolled back from v${version} to v${nextVersion}`);
            } catch (error) {
                console.error(error);
                setErrorMessage(`Error rolling back from v${version} to v${nextVersion}: ${error.response ? error.response.data : error.message}`);
                break;
            }
        }
    };

    return (
        <div>
            <h2>Rollback</h2>
            <div className="version">
                <label>From:</label>
                <input
                    type="number"
                    value={fromVersion}
                    min="2"
                    onChange={(e) => setFromVersion(parseInt(e.target.value, 10))}
                />
                <label className='label-to'>To:</label>
                <input
                    type="number"
                    value={toVersion}
                    min="1"
                    onChange={(e) => setToVersion(parseInt(e.target.value, 10))}
                />
            </div>
            <input type="text" name="host" placeholder="Host" onChange={handleChange} />
            <input type="text" name="user" placeholder="User" onChange={handleChange} />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} />
            <input type="text" name="database" placeholder="Database" onChange={handleChange} />
            <button onClick={handleRollback}>Rollback</button>
            {errorMessage && <div className="error">{errorMessage}</div>} {/* Yeni eklendi */}
        </div>
    );
};

export default Rollback;
