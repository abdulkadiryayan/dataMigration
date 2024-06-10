import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loading from './Loading'; // Import the Loading component
import Review from './Review';

const Migration = () => {
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
    const [migrationScripts, setMigrationScripts] = useState([]);
    const [toVersion, setToVersion] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showReview, setShowReview] = useState(false);
    const [loading, setLoading] = useState(false); // State variable for loading

    useEffect(() => {
        axios.get('http://localhost:3000/configurations')
            .then(response => setConfigurations(response.data))
            .catch(error => console.error('Error fetching configurations:', error));

        axios.get('http://localhost:3000/migration_list')
            .then(response => {
                const versions = response.data.map(script => script.match(/\d+(\.\d+)+/)[0]);
                setMigrationScripts(versions);
            })
            .catch(error => console.error('Error fetching migration scripts:', error));
    }, []);

    const handleConfigChange = async (e) => {
        const configKey = e.target.value;
        setSelectedConfig(configKey);
        setLoading(true); // Set loading to true before starting the fetch
        try {
            const configDetails = await axios.get(`http://localhost:3000/config_details?configKey=${configKey}`);
            setTargetDbConnection(configDetails.data);
            const currentVersionResponse = await axios.get(`http://localhost:3000/current_version?configName=${configKey}`);
            setCurrentVersion(currentVersionResponse.data);
            setLoading(false); // Set loading to false after fetch completes
        } catch (error) {
            console.error('Error fetching configuration details:', error);
            setCurrentVersion('-'); // Set current version to "-" if error occurs
            setLoading(false); // Set loading to false after fetch completes
            if (error.response && error.response.status === 404) {
                alert('Version table does not exist in the selected database.');
                setCurrentVersion("-");
            } if(error.response.status === 500 )  {
                alert('Error fetching current version');
                setCurrentVersion("-")
            }
        }
    };

    const handleMigrate = async () => {
        setErrorMessage('');
        if (!selectedConfig) {
            alert('Please select a configuration');
            return;
        }
        if (!toVersion) {
            alert('Please select a target version');
            return;
        }
        setShowReview(true);
    };

    const confirmMigrate = async () => {
        setLoading(true); // Set loading to true before starting the migration
        try {
            const response = await axios.post('http://localhost:3000/check_migration_files', {
                from: currentVersion,
                to: toVersion
            });

            if (response.data.success) {
                try {
                    await axios.post('http://localhost:3000/migrate', {
                        from: currentVersion,
                        to: toVersion,
                        target_db_connection: targetDbConnection,
                        configName: selectedConfig
                    });
                    alert(`Successfully migrated from v${currentVersion} to v${toVersion}`);
                    setCurrentVersion(toVersion);
                } catch (error) {
                    console.error(error);
                    setErrorMessage(`Error migrating from v${currentVersion} to v${toVersion}: ${error.response ? error.response.data : error.message}`);
                }
            } else {
                setErrorMessage(response.data.message);
            }
        } catch (error) {
            setErrorMessage('Error checking migration files: ' + error.message);
        } finally {
            setLoading(false); // Set loading to false after migration completes
        }
        setShowReview(false);
    };

    const cancelMigrate = () => {
        setShowReview(false);
    };

    return (
        <div>
            {loading && <Loading />} {/* Conditionally render Loading component */}
            {!loading && (
                <>
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
                            onConfirm={confirmMigrate}
                            onCancel={cancelMigrate}
                            type="Migration"
                        />
                    ) : (
                        <>
                            <h2>Migration</h2>
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
                                        <select
                                            value={toVersion}
                                            onChange={(e) => setToVersion(e.target.value)}
                                        >
                                            <option value="">Select Target Version</option>
                                            {migrationScripts.map(script => (
                                                <option key={script} value={script}>{script}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="config-card">
                                        <p><strong>Host:</strong> {targetDbConnection.host}</p>
                                        <p><strong>User:</strong> {targetDbConnection.user}</p>
                                        <p><strong>Password:</strong> {targetDbConnection.password}</p>
                                        <p><strong>Database:</strong> {targetDbConnection.database}</p>
                                        <p><strong>Port:</strong> {targetDbConnection.port}</p>
                                        <button onClick={handleMigrate}>Migrate</button>
                                    </div>
                                </>
                            )}
                            {errorMessage && <div className="error">{errorMessage}</div>}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default Migration;
