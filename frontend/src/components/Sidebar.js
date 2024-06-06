import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <ul>
                <li><Link to="/backup">Backup List</Link></li>
                <li><Link to="/dump">Dump</Link></li>
                <li><Link to="/restore">Restore</Link></li>
                <li><Link to="/migration">Migration</Link></li>
                <li><Link to="/rollback">Rollback</Link></li>
                <li><Link to="/file-editor">File Editor</Link></li>
                <li><Link to="/config-manager">Config Manager</Link></li>
            </ul>
        </div>
    );
};

export default Sidebar;
