import React from 'react';
import './Loading.css';

const Loading = ({ message = "Loading data..." }) => {
    return (
        <div className="loading-container">
            <div className="loading-glass">
                <div className="premium-spinner">
                    <div className="spinner-inner"></div>
                    <div className="spinner-outer"></div>
                    <div className="spinner-center">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </div>
                </div>
                <div className="loading-text">
                    <span className="loading-dots">{message}</span>
                    <p className="loading-subtext">Government of India | CivicFix</p>
                </div>
            </div>
        </div>
    );
};

export default Loading;
