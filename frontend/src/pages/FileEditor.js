import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FileEditor = () => {
    const [fileType, setFileType] = useState('migration');
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [fileContent, setFileContent] = useState('');

    useEffect(() => {
        axios.get(`http://localhost:3000/${fileType}_list`)
            .then(response => setFiles(response.data))
            .catch(error => console.error('Error fetching file list:', error));
    }, [fileType]);

    const handleFileSelect = (e) => {
        const fileName = e.target.value;
        setSelectedFile(fileName);
        if (fileName) {
            axios.get(`http://localhost:3000/get_script`, {
                params: { file: fileName, type: fileType }
            })
                .then(response => setFileContent(response.data))
                .catch(error => console.error('Error fetching file content:', error));
        } else {
            setFileContent('');
        }
    };

    const handleSave = () => {
        axios.post('http://localhost:3000/save_script', { fileName: selectedFile, fileContent, fileType })
            .then(response => alert(response.data))
            .catch(error => alert('Error saving file:', error));
    };

    return (
        <div>
            <h2>File Editor</h2>
            <div>
                <label>
                    <input
                        type="radio"
                        name="fileType"
                        value="migration"
                        checked={fileType === 'migration'}
                        onChange={() => setFileType('migration')}
                    />
                    Migration
                </label>
                <label>
                    <input
                        type="radio"
                        name="fileType"
                        value="rollback"
                        checked={fileType === 'rollback'}
                        onChange={() => setFileType('rollback')}
                    />
                    Rollback
                </label>
            </div>
            <div>
                <select value={selectedFile} onChange={handleFileSelect}>
                    <option value="">Select a file</option>
                    {files.map(file => (
                        <option key={file} value={file}>
                            {file}
                        </option>
                    ))}
                </select>
            </div>
            {selectedFile && (
                <div>
                    <h3>Editing: {selectedFile}</h3>
                    <textarea
                        value={fileContent}
                        onChange={e => setFileContent(e.target.value)}
                        rows="20"
                        cols="80"
                    />
                    <button onClick={handleSave}>Save</button>
                </div>
            )}
        </div>
    );
};

export default FileEditor;
