import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FileEditor = () => {
    const [fileType, setFileType] = useState('migration');
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [fromVersion, setFromVersion] = useState(1);
    const [toVersion, setToVersion] = useState(2);
    const [isNewFile, setIsNewFile] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const fetchFileList = useCallback(() => {
        axios.get(`http://localhost:3000/${fileType}_list`)
            .then(response => {
                const sortedFiles = response.data.sort(); // Dosya isimlerini alfabetik olarak sırala
                setFiles(sortedFiles);
            })
            .catch(error => console.error('Error fetching file list:', error));
    }, [fileType]);

    useEffect(() => {
        fetchFileList();
    }, [fileType, fetchFileList]);

    const handleFileSelect = (e) => {
        if (isNewFile && isDirty) {
            const confirm = window.confirm('You have unsaved changes. Do you want to save the file?');
            if (confirm) {
                handleSave();
            } else {
                setFiles(files.filter(file => file !== selectedFile));
                setSelectedFile('');
                setFileContent('');
                setIsNewFile(false);
                setIsDirty(false);
                return;
            }
        }
        const fileName = e.target.value;
        setSelectedFile(fileName);
        setIsNewFile(false);
        setIsDirty(false);
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
        axios.post('http://localhost:3000/save_script', { fileName: selectedFile, fileContent, fileType, isNewFile })
            .then(response => {
                toast.success(response.data);
                fetchFileList();
                setIsNewFile(false);
                setIsDirty(false);
            })
            .catch(error => toast.error('Error saving file: ' + error.response.data));
    };

    const handleCreateNewFile = () => {
        if (fromVersion !== toVersion) {
            const newFile = `${fileType}_v${fromVersion}_to_v${toVersion}.sql`;
            if (files.includes(newFile)) {
                toast.error('A file with the same name already exists.');
            } else {
                setSelectedFile(newFile);
                setFileContent(`--V${toVersion}`);
                setFiles([...files, newFile].sort());
                setIsNewFile(true);
                setIsDirty(true);
                toast.success('File created successfully.');
            }
        } else {
            toast.error('Please ensure "from" and "to" versions are different');
        }
    };

    const handleDelete = () => {
        if (!isNewFile) {
            axios.post('http://localhost:3000/delete_script', { fileName: selectedFile, fileType })
                .then(response => {
                    toast.success(response.data);
                    setSelectedFile('');
                    setFileContent('');
                    fetchFileList();
                    setIsNewFile(false);
                    setIsDirty(false);
                })
                .catch(error => toast.error('Error deleting file: ' + error.response.data));
        } else {
            setFiles(files.filter(file => file !== selectedFile));
            setSelectedFile('');
            setFileContent('');
            setIsNewFile(false);
            setIsDirty(false);
            toast.success('Unsaved file discarded.');
        }
    };

    const handleFromVersionChange = (e) => {
        const from = parseInt(e.target.value, 10);
        if (fileType === 'migration' && from >= 1) {
            setFromVersion(from);
            setToVersion(from + 1);
        } else if (fileType === 'rollback' && from >= 2) {
            setFromVersion(from);
            setToVersion(from - 1);
        }
    };

    const handleRadioChange = (e) => {
        if (isNewFile && isDirty) {
            const confirm = window.confirm('You have unsaved changes. Do you want to save the file?');
            if (confirm) {
                handleSave();
            } else {
                setFiles(files.filter(file => file !== selectedFile));
                setSelectedFile('');
                setFileContent('');
                setIsNewFile(false);
                setIsDirty(false);
            }
        }
        const newFileType = e.target.value;
        setFileType(newFileType);
        setSelectedFile('');
        setFiles([]);
        setFromVersion(newFileType === 'migration' ? 1 : 2);
        setToVersion(newFileType === 'migration' ? 2 : 1);
        setIsDirty(false); 
        fetchFileList();
    };

    // const control = fileContent.charAt(3)
    
    // var versionNum = control
    
    return (
        <div>
            <h2>File Editor</h2>
            {/* <h3>{isNaN(control) ? null : versionNum }</h3> */}
            <ToastContainer position="top-right" autoClose={10000} />
            <div>
                <label>
                    <input
                        type="radio"
                        name="fileType"
                        value="migration"
                        checked={fileType === 'migration'}
                        onChange={handleRadioChange}
                    />
                    Migration
                </label>
                <label>
                    <input
                        type="radio"
                        name="fileType"
                        value="rollback"
                        checked={fileType === 'rollback'}
                        onChange={handleRadioChange}
                    />
                    Rollback
                </label>
            </div>
            <div className='fe-select'>
                <select value={selectedFile} onChange={handleFileSelect}>
                    <option value="">Select a file</option>
                    {files.map(file => (
                        <option key={file} value={file}>
                            {file}
                        </option>
                    ))}
                </select>
            </div>
            <div className='new-file'>
                <button onClick={handleCreateNewFile}>Create New File</button>
            </div>
            <div className='version'>
                <label>From:</label>
                <input
                    type="number"
                    value={fromVersion}
                    min={fileType === 'migration' ? 1 : 2}
                    onChange={handleFromVersionChange}
                />
                <label className='label-to'>To:</label>
                <input
                    type="number"
                    value={toVersion}
                    readOnly
                />
            </div>
            {selectedFile && (
                <div>
                    <h3>Editing: {selectedFile}</h3>
                    <textarea
                        value={fileContent}
                        onChange={e => {
                            setFileContent(e.target.value);
                            setIsDirty(true);
                        }}
                        rows="20"
                        cols="80"
                    />
                    <div>
                        <button onClick={handleSave}>Save</button>
                        <button onClick={handleDelete}>Delete</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileEditor;
