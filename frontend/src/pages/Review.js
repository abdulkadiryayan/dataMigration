import React from 'react';
import './Review.css'

const Review = ({ details, onConfirm, onCancel, type }) => {
    return (
        <div className="review-container">
            <h2 className='rev'>Review Your {type} Details</h2>
            <div className="review-details">
                {type==='Migration' || type==='Rollback' 
                ?<div><p>Operation <strong>{type}</strong></p> <h2><strong>{details['From Version']}</strong> {"==>"} <strong>{details['To Version']}</strong></h2></div>
                 :<p>Operation <strong>{type}</strong></p>}
                    
                <div className="review-config">
                    <p>Configuration Details:</p>
                    <ul>
                        <li>Host: <strong>{details.Host}</strong></li>
                        <li>User: <strong>{details.User}</strong></li>
                        <li>Password: <strong>{details.Password}</strong></li>
                        <li>Database: <strong>{details.Database}</strong></li>
                        <li>Port: <strong>{details.Port}</strong></li>
                        {details.BackupFile &&(
                            <li>Backup File: <strong>{details.BackupFile}</strong></li>
                        )}
                    </ul>
                </div>
            </div>
            <div className="review-actions">
                <button className="review-button cancel" onClick={onCancel}>Cancel</button>
                <button className="review-button confirm" onClick={() => {
                        if (window.confirm('Are you sure?')) {
                            onConfirm();
                        } else {
                            onCancel();
                        }
                    }}>Confirm</button>
            </div>
        </div>
    );
};

export default Review;
