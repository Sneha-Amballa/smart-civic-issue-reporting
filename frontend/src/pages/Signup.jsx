import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import i18n from '../i18n';
import '../styles/AuthStyles.css';

const Signup = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        preferred_language: 'en' // Default to English
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLanguageChange = (e) => {
        const lang = e.target.value;
        setFormData({ ...formData, preferred_language: lang });
        localStorage.setItem('language', lang);
        i18n.changeLanguage(lang);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/signup`, formData);
            await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/send-otp`, { email: formData.email });
            navigate('/verify-otp', { state: { email: formData.email, isSignup: true } });
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="card split-card">
                <div className="auth-branding">
                    <div className="branding-content">
                        <div className="branding-logo">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <h2>CIVICFIX</h2>
                        </div>
                        <p>{t('branding_desc')}</p>
                        <Link to="/" className="branding-btn">{t('back_to_home')}</Link>
                    </div>
                </div>
                
                <div className="auth-form-wrapper">
                    <div className="auth-header">
                        <h2>{t('signup_title')}</h2>
                        <p>{t('auth_subtitle_signup')}</p>
                    </div>
                
                <div className="auth-body">
                    {error && (
                        <div className="error-message">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>{t('name')}</label>
                            <input
                                type="text"
                                name="name"
                                className="input-field"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder={t('name').toLowerCase()}
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
                                placeholder="you@example.com"
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
                                placeholder="+91 98765 43210"
                            />
                        </div>

                        <div className="input-group">
                            <label>{t('preferred_language_label')}</label>
                            <select 
                                className="input-field"
                                value={formData.preferred_language}
                                onChange={handleLanguageChange}
                            >
                                <option value="en">{t('lang_en')}</option>
                                <option value="hi">{t('lang_hi')}</option>
                                <option value="te">{t('lang_te')}</option>
                            </select>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary btn-block" 
                            disabled={loading}
                        >
                            {loading ? t('loading') : t('cta_signup')}
                        </button>
                    </form>

                    <div className="divider">OR</div>

                    <div className="footer-links">
                        <Link to="/login" className="link">
                            {t('already_have_account')}
                        </Link>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;