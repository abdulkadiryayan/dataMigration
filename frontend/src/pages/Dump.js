import React, { useState } from 'react';
import axios from 'axios';

const Dump = () => {
    const [targetDbConnection, setTargetDbConnection] = useState({
        host: '',
        user: '',
        password: '',
        database: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTargetDbConnection({
            ...targetDbConnection,
            [name]: value
        });
    };

    const handleDump = () => {
        axios.post('http://localhost:3000/dump', { target_db_connection: targetDbConnection })
            .then(response => alert(response.data))
            .catch(error => {
                console.error('Error during dump:', error);
                if (error.response) {
                    alert('Error during dump: ' + error.response.data);
                } else {
                    alert('Error during dump: ' + error.message);
                }
            });
    };

    return (
        <div>
            <h2>Dump</h2>
            <input type="text" name="host" placeholder="Host" onChange={handleChange} />
            <input type="text" name="user" placeholder="User" onChange={handleChange} />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} />
            <input type="text" name="database" placeholder="Database" onChange={handleChange} />
            <button onClick={handleDump}>Dump</button>
        </div>
    );
};

export default Dump;
