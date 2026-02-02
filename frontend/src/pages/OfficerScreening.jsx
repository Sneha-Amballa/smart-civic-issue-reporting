import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OfficerScreening = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const officer = state?.officer;

    const [screeningStatus, setScreeningStatus] = useState('PENDING'); // PENDING, COMPLETE
    const [aiResult, setAiResult] = useState(null);

    useEffect(() => {
        if (!officer) {
            navigate('/officer/register');
            return;
        }

        // Poll for AI status or if it was done synchronously (We did it sync in backend)
        // Since we are doing it sync in backend, we might already have it. 
        // But for "Effect" let's simulate a delay or check if backend did it.
        // Actually, let's implement the backend to do it async or sync. 
        // For this demo, let's assume backend returns "AI_PENDING" and we show the user "Screening...".

        if (officer.account_status === 'AI_PENDING') {
            // Check status after 3 seconds (Simulate waiting)
            setTimeout(() => {
                setScreeningStatus('COMPLETE');
                // For now, assume backend already did it, but let's fetch updated user to be sure
                fetchUpdatedOfficer();
            }, 3000);
        } else {
            setScreeningStatus('COMPLETE');
            setAiResult({
                score: officer.ai_score,
                result: officer.ai_result,
                reason: officer.ai_reason
            });
        }
    }, [officer, navigate]);

    const fetchUpdatedOfficer = async () => {
        try {
            // Endpoint to get my details (would need temp token or similar, but for now just use what we have or mock)
            // In a real app we'd query by ID. Here let's trust we saved it.
            // Simplified: Just use the initial data if backend returned it populated.
            setAiResult({
                score: officer.ai_score,
                result: officer.ai_result,
                reason: officer.ai_reason
            });
        } catch (err) {
            console.error(err);
        }
    };

    if (!officer) return null;

    return (
        <div className="auth-container">
            <div className="card auth-card" style={{ textAlign: 'center', maxWidth: '500px' }}>

                {screeningStatus === 'PENDING' ? (
                    <div>
                        <div className="spinner" style={{ margin: '2rem auto', borderTopColor: '#3b82f6' }}></div>
                        <h2>AI Screening in Progress...</h2>
                        <p style={{ color: '#94a3b8' }}>Analyzing document relevance for <strong>{officer.department}</strong> department.</p>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                            {aiResult?.result === 'RELEVANT' ? '✅' : '⚠️'}
                        </div>
                        <h2>Screening Complete</h2>

                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', margin: '2rem 0', textAlign: 'left' }}>
                            <p><strong>Status:</strong> <span style={{ color: aiResult?.result === 'RELEVANT' ? '#4ade80' : '#f87171' }}>{aiResult?.result}</span></p>
                            <p><strong>Relevance Score:</strong> {(aiResult?.score * 100).toFixed(1)}%</p>
                            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '0.5rem' }}>
                                <strong>AI Reason:</strong> "{aiResult?.reason}"
                            </p>
                        </div>

                        {aiResult?.result === 'RELEVANT' ? (
                            <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '8px' }}>
                                <strong>Setup Successful!</strong><br />
                                Your account is now <strong>PENDING ADMIN APPROVAL</strong>. You will be notified via email once authorized to login.
                            </div>
                        ) : (
                            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px' }}>
                                <strong>Verification Flagged</strong><br />
                                Your document content does not sufficiently match your selected department. An admin will review your case manually.
                            </div>
                        )}

                        <button className="btn btn-secondary" style={{ marginTop: '2rem', width: '100%' }} onClick={() => navigate('/')}>
                            Return to Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OfficerScreening;
