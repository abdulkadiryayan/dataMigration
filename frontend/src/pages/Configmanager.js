import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ConfigManager.css';

const ConfigManager = () => {
    const [configurations, setConfigurations] = useState([]);
    const [selectedConfig, setSelectedConfig] = useState('');
    const [configDetails, setConfigDetails] = useState({
        config_name: '',
        host: '',
        user: '',
        password: '',
        database: '',
        port: ''
    });
    const [originalConfigName, setOriginalConfigName] = useState(''); // Added state to store original config name
    const [addVersionTable, setAddVersionTable] = useState(false); // Added state for checkbox
    const [isEditing, setIsEditing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchConfigurations();
    }, []);

    const fetchConfigurations = async () => {
        try {
            const response = await axios.get('http://localhost:3000/configurations');
            setConfigurations(response.data);
        } catch (error) {
            console.error('Error fetching configurations:', error);
        }
    };

    const handleConfigChange = async (e) => {
        const configKey = e.target.value;
        setSelectedConfig(configKey);
        if (configKey) {
            try {
                const response = await axios.get(`http://localhost:3000/config_details?configKey=${configKey}`);
                setConfigDetails(response.data);
                setOriginalConfigName(response.data.config_name); // Set original config name
                setIsEditing(true);
            } catch (error) {
                console.error('Error fetching configuration details:', error);
            }
        } else {
            resetForm();
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setConfigDetails(prevDetails => ({ ...prevDetails, [name]: value }));
    };

    const handleCheckboxChange = (e) => {
        setAddVersionTable(e.target.checked); // Checkbox change handler
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.put('http://localhost:3000/update_configuration', { ...configDetails, original_config_name: originalConfigName });
            } else {
                await axios.post('http://localhost:3000/add_configuration', { ...configDetails, addVersionTable });
            }
            fetchConfigurations();
            resetForm();
        } catch (error) {
            console.error('Error saving configuration:', error);
            setErrorMessage('Error saving configuration');
        }
    };

    const handleDelete = async () => {
        if (selectedConfig) {
            try {
                await axios.delete('http://localhost:3000/delete_configuration', { data: { config_name: selectedConfig } });
                fetchConfigurations();
                resetForm();
            } catch (error) {
                console.error('Error deleting configuration:', error);
                setErrorMessage('Error deleting configuration');
            }
        }
    };

    const resetForm = () => {
        setConfigDetails({
            config_name: '',
            host: '',
            user: '',
            password: '',
            database: '',
            port: ''
        });
        setSelectedConfig('');
        setAddVersionTable(false); // Reset checkbox
        setIsEditing(false);
        setErrorMessage('');
    };

    return (
        <div>
            <h2>Configuration Manager</h2>
            <div style={{ display: "inline" }}>
                <label style={{ display: "inline" }}>Configuration:</label>
                <select onChange={handleConfigChange} value={selectedConfig}>
                    <option value="">Add New Configuration</option>
                    {configurations.map(config => (
                        <option key={config.config_name} value={config.config_name}>
                            {config.config_name}
                        </option>
                    ))}
                </select>
            </div>
            <form onSubmit={handleFormSubmit}>
                <div>
                    <label>Config Name:</label>
                    <input type="text" name="config_name" value={configDetails.config_name} onChange={handleInputChange} required />
                </div>
                <div>
                    <label>Host:</label>
                    <input type="text" name="host" value={configDetails.host} onChange={handleInputChange} required />
                </div>
                <div>
                    <label>User:</label>
                    <input type="text" name="user" value={configDetails.user} onChange={handleInputChange} required />
                </div>
                <div>
                    <label>Password:</label>
                    <input type="password" name="password" value={configDetails.password} onChange={handleInputChange} required />
                </div>
                <div>
                    <label>Database:</label>
                    <input type="text" name="database" value={configDetails.database} onChange={handleInputChange} required />
                </div>
                <div>
                    <label>Port:</label>
                    <input type="text" name="port" value={configDetails.port} onChange={handleInputChange} required />
                </div>
                {!isEditing && (
                    <div>
                        <label>
                            <input type="checkbox" checked={addVersionTable} onChange={handleCheckboxChange} />
                            Add Version Table
                        </label>
                    </div>
                )}
                <div>
                    <button type="submit">{isEditing ? 'Update' : 'Add'}</button>
                    {isEditing && <button type="button" onClick={handleDelete}>Delete</button>}
                </div>
            </form>
            {errorMessage && <div className="error">{errorMessage}</div>}
        </div>
    );
};

export default ConfigManager;
