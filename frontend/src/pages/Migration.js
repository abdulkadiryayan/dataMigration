import React, { useState } from 'react';
import axios from 'axios';

const Migration = () => {
    const [fromVersion, setFromVersion] = useState(1);
    const [toVersion, setToVersion] = useState(2);
    const [targetDbConnection, setTargetDbConnection] = useState({
        host: '',
        user: '',
        password: '',
        database: ''
    });
    const [errorMessage, setErrorMessage] = useState(''); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTargetDbConnection({
            ...targetDbConnection,
            [name]: value
        });
    };

    const handleMigrate = async () => {
        setErrorMessage(''); 
        for (let version = fromVersion; version < toVersion; version++) {
            const nextVersion = version + 1;
            try {
                await axios.post('http://localhost:3000/migrate', {
                    from: version,
                    to: nextVersion,
                    target_db_connection: targetDbConnection
                });
                alert(`Successfully migrated from v${version} to v${nextVersion}`);
            } catch (error) {
                console.error(error);
                setErrorMessage(`Error migrating from v${version} to v${nextVersion}: ${error.response ? error.response.data : error.message}`);
                break;
            }
        }
    };

    return (
        <div>
            <h2>Migration</h2>
            
            <div className="version">
                <label>From:</label>
                <input
                    type="number"
                    value={fromVersion}
                    min="1"
                    onChange={(e) => setFromVersion(parseInt(e.target.value, 10))}
                />
                <label className='label-to'>To:</label>
                <input
                    type="number"
                    value={toVersion}
                    min={fromVersion + 1}
                    onChange={(e) => setToVersion(parseInt(e.target.value, 10))}
                />
            </div>
            <input type="text" name="host" placeholder="Host" onChange={handleChange} />
            <input type="text" name="user" placeholder="User" onChange={handleChange} />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} />
            <input type="text" name="database" placeholder="Database" onChange={handleChange} />
            <button onClick={handleMigrate}>Migrate</button>
            {errorMessage && <div className="error">{errorMessage}</div>} {/* Yeni eklendi */}
        </div>
    );
};

export default Migration;
