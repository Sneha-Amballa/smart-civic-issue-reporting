import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('http://localhost:5000/api/auth/login', { email });
            // Navigate to verify
            navigate('/verify-otp', { state: { email, isSignup: false } });

        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="card auth-card">
                <h2 className="text-center mb-4">{t('login')}</h2>

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
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Sending OTP...' : t('send_otp')}
                    </button>
                </form>

                <p className="text-center mt-4">
                    <Link to="/signup" className="link">{t('no_account')}</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
