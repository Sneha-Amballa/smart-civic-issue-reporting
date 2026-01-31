import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        preferred_language: i18n.language // Default to current
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLanguageChange = (e) => {
        const lang = e.target.value;
        setFormData({ ...formData, preferred_language: lang });
        i18n.changeLanguage(lang);
        localStorage.setItem('language', lang);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Create User
            await axios.post('http://localhost:5000/api/auth/signup', formData);

            // 2. Send OTP
            await axios.post('http://localhost:5000/api/auth/send-otp', { email: formData.email });

            // 3. Navigate to Verify
            navigate('/verify-otp', { state: { email: formData.email, isSignup: true } });

        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="card auth-card">
                <h2 className="text-center mb-4">{t('signup')}</h2>

                {error && <div className="text-center" style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>{t('name')}</label>
                        <input
                            type="text"
                            name="name"
                            className="input-field"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>{t('email')}</label>
                        <input
                            type="email"
                            name="email"
                            className="input-field"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>{t('phone')}</label>
                        <input
                            type="tel"
                            name="phone"
                            className="input-field"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="input-group">
                        <label>{t('language')}</label>
                        <select
                            name="preferred_language"
                            className="input-field"
                            value={formData.preferred_language}
                            onChange={handleLanguageChange}
                        >
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                            <option value="te">Telugu</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Processing...' : t('submit')}
                    </button>
                </form>

                <p className="text-center mt-4">
                    <Link to="/login" className="link">{t('already_account')}</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
