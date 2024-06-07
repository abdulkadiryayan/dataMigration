import React from 'react';
import './App.css'
import './pages/ConfigManager.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BackupList from './pages/BackupList';
import Dump from './pages/Dump';
import Restore from './pages/Restore';
import Migration from './pages/Migration';
import Rollback from './pages/Rollback';
import FileEditor from './pages/FileEditor';
import ConfigManager from './pages/Configmanager';

function App() {
    return (
        <Router>
            <div className="app">
                <Sidebar />
                <div className="content">
                    <Routes>
                        <Route path="/backup" element={<BackupList />} />
                        <Route path="/dump" element={<Dump />} />
                        <Route path="/restore" element={<Restore />} />
                        <Route path="/migration" element={<Migration />} />
                        <Route path="/rollback" element={<Rollback />} />
                        <Route path="/file-editor" element={<FileEditor />} />
                        <Route path="/config-manager" element={<ConfigManager />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
