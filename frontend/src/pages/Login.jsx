import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';

const ADMIN_EMAIL = "sneha.amballa0804@gmail.com";

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // New state for admin password
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isAdmin = email === ADMIN_EMAIL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isAdmin) {
                // Admin Login Flow (Password based)
                const res = await axios.post('http://localhost:5000/api/auth/admin-login', {
                    email,
                    password
                });

                // Login Success -> Store Token -> Admin Dashboard
                const { token, user } = res.data;
                localStorage.setItem('token', token);
                if (user.preferred_language) {
                    localStorage.setItem('language', user.preferred_language);
                }
                navigate('/admin/dashboard');

            } else {
                // Normal User Flow (OTP based)
                await axios.post('http://localhost:5000/api/auth/login', { email });
                navigate('/verify-otp', { state: { email, isSignup: false } });
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="card auth-card">
                <h2 className="text-center mb-4">{isAdmin ? 'Admin Login' : t('login')}</h2>

                {error && <div className="text-center" style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>{t('email')}</label>
                        <input
                            type="email"
                            name="email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    {isAdmin && (
                        <div className="input-group">
                            <label>Admin Secret Code</label>
                            <input
                                type="password"
                                name="password"
                                className="input-field"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter admin secret"
                                autoComplete="current-password"
                            />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Processing...' : (isAdmin ? 'Login as Admin' : t('send_otp'))}
                    </button>
                </form>

                {!isAdmin && (
                    <p className="text-center mt-4">
                        <Link to="/signup" className="link">{t('no_account')}</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;
