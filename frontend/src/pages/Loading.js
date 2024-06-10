// Loading.js
import React from 'react';
import './Loading.css'; // Add your CSS for the spinner or loading message here

const Loading = () => {
    return (
        <div className="loading-screen">
            <div className="spinner"></div>
            <p>Loading...</p>
        </div>
    );
};

export default Loading;
