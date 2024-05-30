import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Review from './Review';

const Rollback = () => {
    const [configurations, setConfigurations] = useState([]);
    const [selectedConfig, setSelectedConfig] = useState('');
    const [targetDbConnection, setTargetDbConnection] = useState({
        host: '',
        user: '',
        password: '',
        database: '',
        port: ''
    });
    const [currentVersion, setCurrentVersion] = useState('');
    const [toVersion, setToVersion] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showReview, setShowReview] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:3000/configurations')
            .then(response => setConfigurations(response.data))
            .catch(error => console.error('Error fetching configurations:', error));
    }, []);

    const handleConfigChange = (e) => {
        const configKey = e.target.value;
        setSelectedConfig(configKey);

        axios.get(`http://localhost:3000/config_details?configKey=${configKey}`)
            .then(response => {
                setTargetDbConnection(response.data);
                return axios.get(`http://localhost:3000/current_version?configName=${configKey}`);
            })
            .then(response => setCurrentVersion(response.data))
            .catch(error => console.error('Error fetching configuration details:', error));
    };

    const handleRollback = async () => {
        setErrorMessage('');
        if (!selectedConfig) {
            alert('Please select a configuration');
            return;
        }
        if(toVersion.length===0){
            alert('Please select target version');
            return;
        }
        setShowReview(true);
    };

    const confirmRollback = async () => {
        try {
            const response = await axios.post('http://localhost:3000/check_rollback_files', {
                from: currentVersion,
                to: toVersion
            });

            if (response.data.success) {
                try {
                    await axios.post('http://localhost:3000/rollback', {
                        from: currentVersion,
                        to: toVersion,
                        target_db_connection: targetDbConnection,
                        configName: selectedConfig
                    });
                    alert(`Successfully rolled back from v${currentVersion} to v${toVersion}`);
                    setCurrentVersion(toVersion); // Güncellenen versiyonu currentVersion olarak ayarla
                } catch (error) {
                    console.error(error);
                    setErrorMessage(`Error rolling back from v${currentVersion} to v${toVersion}: ${error.response ? error.response.data : error.message}`);
                }
            } else {
                setErrorMessage(response.data.message);
            }
        } catch (error) {
            setErrorMessage('Error checking rollback files: ' + error.message);
        }
        setShowReview(false);
    };

    const cancelRollback = () => {
        setShowReview(false);
    };

    return (
        <div>
            {showReview ? (
                <Review
                    details={{
                        'From Version': currentVersion,
                        'To Version': toVersion,
                        'Host': targetDbConnection.host,
                        'User': targetDbConnection.user,
                        'Password': targetDbConnection.password,
                        'Database': targetDbConnection.database,
                        'Port': targetDbConnection.port
                    }}
                    onConfirm={confirmRollback}
                    onCancel={cancelRollback}
                    type="Rollback"
                />
            ) : (
                <>
                    <h2>Rollback</h2>
                    <div>
                        <label>Configuration:</label>
                        <select onChange={handleConfigChange} value={selectedConfig}>
                            <option value="">Select Configuration</option>
                            {configurations.map(config => (
                                <option key={config.config_name} value={config.config_name}>
                                    {config.config_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {selectedConfig && (
                        <>
                            <div className="version">
                                <label>Current Version: <b>{currentVersion}</b></label>
                                <label className='label-to'>To:</label>
                                <input
                                    type="text"
                                    value={toVersion}
                                    onChange={(e) => setToVersion(e.target.value)}
                                    placeholder="Target version"
                                />
                            </div>


                            <div className="config-card">
                                <p><strong>Host:</strong> {targetDbConnection.host}</p>
                                <p><strong>User:</strong> {targetDbConnection.user}</p>
                                <p><strong>Password:</strong> {targetDbConnection.password}</p>
                                <p><strong>Database:</strong> {targetDbConnection.database}</p>
                                <p><strong>Port:</strong> {targetDbConnection.port}</p>
                                <button onClick={handleRollback}>Rollback</button>
                            </div>
                        </>
                    )}
                    {errorMessage && <div className="error">{errorMessage}</div>}
                </>
            )}
        </div>
    );
};

export default Rollback;
