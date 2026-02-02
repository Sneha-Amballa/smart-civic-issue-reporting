import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SelectRole.css'; // We'll create a simple CSS for this

const SelectRole = () => {
    const navigate = useNavigate();

    const handleSelect = (role) => {
        // Navigate to signup with role as query parameter
        navigate(`/signup?role=${role}`);
    };

    return (
        <div className="role-container">
            <h1 className="role-title">Choose Your Role</h1>
            <p className="role-subtitle">Select how you want to contribute to the community</p>

            <div className="role-cards">
                {/* Citizen Role */}
                <div className="role-card citizen-card" onClick={() => navigate('/citizen-signup')}>
                    <div className="role-icon">🧑</div>
                    <h2>Citizen</h2>
                    <p>Report issues, track status, and help improve your neighborhood.</p>
                </div>

                {/* Officer Role */}
                <div className="role-card officer-card" onClick={() => navigate('/officer/register')}>
                    <div className="role-icon">👮</div>
                    <h2>Officer</h2>
                    <p>Manage reports, verify issues, and coordinate resolutions.</p>
                </div>
            </div>

            <p style={{ marginTop: '2rem', color: '#94a3b8' }}>
                Already have an account? <span onClick={() => navigate('/login')} style={{ color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }}>Login here</span>
            </p>
        </div>
    );
};

export default SelectRole;
