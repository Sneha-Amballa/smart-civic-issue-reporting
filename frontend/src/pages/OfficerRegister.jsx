import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import '../styles/OfficerRegister.css'; // Just using inline generally, but consistent with style

const OfficerRegister = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
    });
    const [document, setDocument] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setDocument(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!document) {
            setError("Please upload a supporting document.");
            setLoading(false);
            return;
        }

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            data.append('department', formData.department);
            data.append('designation', formData.designation);
            data.append('document', document);

            const response = await axios.post('http://localhost:5000/api/auth/officer-register', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Redirect to screening page with user data
            navigate('/officer/screening', { state: { officer: response.data.officer } });

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="card auth-card" style={{ maxWidth: '600px' }}>
                <h2 className="text-center mb-4">Officer Registration</h2>
                <p className="text-center" style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                    Join the force to manage and resolve civic issues.
                </p>

                {error && <div className="text-center" style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Full Name</label>
                            <input type="text" name="name" className="input-field" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="input-group">
                            <label>Phone Number</label>
                            <input type="tel" name="phone" className="input-field" value={formData.phone} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Email Address</label>
                        <input type="email" name="email" className="input-field" value={formData.email} onChange={handleChange} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Department</label>
                            <select name="department" className="input-field" value={formData.department} onChange={handleChange} required>
                                <option value="">Select Department</option>
                                <option value="Roads">Roads</option>
                                <option value="Water Supply">Water Supply</option>
                                <option value="Sanitation">Sanitation</option>
                                <option value="Drainage">Drainage</option>
                                <option value="Street Lighting">Street Lighting</option>
                                <option value="Solid Waste Management">Solid Waste Management</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Designation (Optional)</label>
                            <input type="text" name="designation" className="input-field" value={formData.designation} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Supporting Document (PDF/JPG/PNG)</label>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                            Upload Appointment Letter or ID Proof for verification (Max 5MB).
                        </p>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="input-field" onChange={handleFileChange} required />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Submitting & Screening...' : 'Register & Verify'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OfficerRegister;
