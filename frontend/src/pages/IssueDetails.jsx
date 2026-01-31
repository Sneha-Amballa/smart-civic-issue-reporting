import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css'; // Reusing dashboard styles for consistency

const IssueDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchIssueDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:5000/api/issues/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIssue(response.data);
            } catch (err) {
                console.error("Error fetching issue details:", err);
                setError("Failed to load issue details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchIssueDetails();
    }, [id]);

    if (loading) return <div className="container text-center"><p>Loading details...</p></div>;
    if (error) return <div className="container text-center"><p style={{ color: 'red' }}>{error}</p></div>;
    if (!issue) return <div className="container text-center"><p>Issue not found.</p></div>;

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const dateString = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <button className="btn btn-secondary mb-4" onClick={() => navigate('/dashboard')}>
                &larr; Back to Dashboard
            </button>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1>{issue.category}</h1>
                    <span className={`status-badge status-${(issue.status || 'reported').toLowerCase().replace(' ', '-')}`}
                        style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                        {issue.status}
                    </span>
                </div>

                <div className="mb-4">
                    <img
                        src={issue.image}
                        alt="Issue Evidence"
                        style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
                    />
                </div>

                {issue.ai_status && (
                    <div className="mb-4">
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>AI ANALYSIS</h3>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 'bold', marginRight: '1rem', color: issue.ai_status === 'Verified' ? '#4ade80' : '#f87171' }}>
                                    {issue.ai_status === 'Verified' ? '✅ Verified Issue' : '⚠️ Flagged for Review'}
                                </span>
                                <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Confidence: {issue.ai_confidence ? (issue.ai_confidence * 100).toFixed(1) : 0}%</span>
                            </div>
                            <p style={{ margin: 0, fontStyle: 'italic', color: '#e2e8f0' }}>"{issue.ai_reason}"</p>
                        </div>
                    </div>
                )}

                <div className="mb-4">
                    <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>DESCRIPTION (Voice Input)</h3>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', fontSize: '1.1rem' }}>
                        {issue.voice_text || "No description provided."}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.2rem' }}>REPORTED ON</h3>
                        <p>{formatDate(issue.timestamp)}</p>
                    </div>
                    <div>
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.2rem' }}>LOCATION</h3>
                        <p>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link"
                            >
                                {Number(issue.latitude).toFixed(6)}, {Number(issue.longitude).toFixed(6)} ↗
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueDetails;
