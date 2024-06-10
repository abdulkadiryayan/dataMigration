import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Review from './Review';
import Loading from './Loading'; // Make sure to create a Loading component

const Dump = () => {
    const [configurations, setConfigurations] = useState([]);
    const [selectedConfig, setSelectedConfig] = useState('');
    const [targetDbConnection, setTargetDbConnection] = useState({
        host: '',
        user: '',
        password: '',
        database: '',
        port: ''
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [showReview, setShowReview] = useState(false);
    const [loading, setLoading] = useState(false); // State variable for loading

    useEffect(() => {
        axios.get('http://localhost:3000/configurations')
            .then(response => setConfigurations(response.data))
            .catch(error => console.error('Error fetching configurations:', error));
    }, []);

    const handleConfigChange = async (e) => {
        const configName = e.target.value;
        setSelectedConfig(configName);

        if (configName) {
            try {
                const response = await axios.get('http://localhost:3000/config_details', {
                    params: { configKey: configName }
                });

                const config = response.data;
                setTargetDbConnection({
                    host: config.host,
                    user: config.user,
                    password: config.password,
                    database: config.database,
                    port: config.port
                });
            } catch (error) {
                console.error('Error fetching config details:', error);
                setErrorMessage('Error fetching config details: ' + error.message);
            }
        } else {
            setTargetDbConnection({
                host: '',
                user: '',
                password: '',
                database: '',
                port: ''
            });
        }
    };

    const handleDump = () => {
        setShowReview(true);
    };

    const cancelDump = () => {
        setShowReview(false);
    };

    const confirmDump = async () => {
        if (!selectedConfig) {
            alert('Please select a configuration.');
            return;
        }
        setLoading(true); // Set loading to true before starting the dump
        try {
            const response = await axios.post('http://localhost:3000/dump', { target_db_connection: targetDbConnection });
            alert(response.data);
        } catch (error) {
            console.error('Error during dump:', error);
            if (error.response) {
                alert('Error during dump: ' + error.response.data);
            } else {
                alert('Error during dump: ' + error.message);
            }
        } finally {
            setLoading(false); // Set loading to false after dump completes
        }
        setShowReview(false); // Reset review state after confirming
    };

    return (
        <div>
            {loading && <Loading />} {/* Conditionally render Loading component */}
            {!loading && (
                <>
                    {showReview ? (
                        <Review
                            details={{
                                'Host': targetDbConnection.host,
                                'User': targetDbConnection.user,
                                'Password': targetDbConnection.password,
                                'Database': targetDbConnection.database,
                                'Port': targetDbConnection.port
                            }}
                            onConfirm={confirmDump}
                            onCancel={cancelDump}
                            type="Dump"
                        />
                    ) : (
                        <>
                            <h2>Dump</h2>
                            {errorMessage && <div className="error">{errorMessage}</div>}
                            <div>
                                <label>Configuration:</label>
                                <select value={selectedConfig} onChange={handleConfigChange}>
                                    <option value="">Select Configuration</option>
                                    {configurations.map(config => (
                                        <option key={config.config_name} value={config.config_name}>
                                            {config.config_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {selectedConfig && (
                                <div className="config-card">
                                    <p><strong>Host:</strong> {targetDbConnection.host}</p>
                                    <p><strong>User:</strong> {targetDbConnection.user}</p>
                                    <p><strong>Password:</strong> {targetDbConnection.password}</p>
                                    <p><strong>Database:</strong> {targetDbConnection.database}</p>
                                    <p><strong>Port:</strong> {targetDbConnection.port}</p>
                                    <button onClick={handleDump}>Dump</button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default Dump;
