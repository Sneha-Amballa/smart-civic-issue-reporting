import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = require('react-router-dom').useNavigate();



    useEffect(() => {
        fetchPendingOfficers();
    }, []);

    const fetchPendingOfficers = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) navigate('/login');

            const res = await axios.get('http://localhost:5000/api/admin/all-officers', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setOfficers(res.data);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 403) {
                alert("Unauthorized Access");
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/admin/${action}/${id}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            fetchPendingOfficers(); // Refresh
            alert(`Officer ${action}ed successfully`);
        } catch (err) {
            alert('Action failed');
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Admin Dashboard</h1>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </header>
            <main style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Officer Management</h2>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Showing all applicants</span>
                </div>
                {loading ? <p>Loading...</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', color: 'white', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ background: '#334155', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>Name</th>
                                    <th style={{ padding: '12px' }}>Department</th>
                                    <th style={{ padding: '12px' }}>Status</th>
                                    <th style={{ padding: '12px' }}>AI Score</th>
                                    <th style={{ padding: '12px' }}>Reason</th>
                                    <th style={{ padding: '12px' }}>Document</th>
                                    <th style={{ padding: '12px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {officers.length === 0 ? (
                                    <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>No officers found.</td></tr>
                                ) : (
                                    officers.map(o => (
                                        <tr key={o.id} style={{ borderBottom: '1px solid #475569', background: o.account_status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}>
                                            <td style={{ padding: '12px' }}>{o.name} <br /><span style={{ fontSize: '0.8em', opacity: 0.7 }}>{o.email}</span></td>
                                            <td style={{ padding: '12px' }}>{o.department}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: '4px',
                                                    background: o.account_status === 'ACTIVE' ? '#166534' : o.account_status === 'REJECTED' ? '#991b1b' : '#ca8a04',
                                                    color: 'white', fontSize: '0.8rem', fontWeight: 'bold'
                                                }}>
                                                    {o.account_status || 'PENDING'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    background: o.ai_score >= 0.6 ? '#166534' : '#ca8a04',
                                                    color: 'white'
                                                }}>
                                                    {o.ai_score}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', maxWidth: '200px' }}>{o.ai_reason}</td>
                                            <td style={{ padding: '12px' }}>
                                                <a href={o.document_url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>View</a>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <button onClick={() => handleAction(o.id, 'approve')} style={{ marginRight: '8px', background: '#22c55e', color: 'black', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
                                                <button onClick={() => handleAction(o.id, 'reject')} style={{ background: '#ef4444', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <h2 style={{ marginTop: '3rem' }}>All Reported Issues</h2>
                <div style={{ overflowX: 'auto' }}>
                    <IssuesTable />
                </div>
            </main>
        </div>
    );
};

// Sub-component for clean code
const IssuesTable = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState(null);

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/admin/all-issues', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIssues(res.data);
            } catch (err) {
                console.error("Failed to fetch issues", err);
            } finally {
                setLoading(false);
            }
        };
        fetchIssues();
    }, []);

    if (loading) return <p>Loading issues...</p>;

    return (
        <>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', color: 'white', minWidth: '800px' }}>
                <thead>
                    <tr style={{ background: '#334155', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>Category</th>
                        <th style={{ padding: '12px' }}>Description</th>
                        <th style={{ padding: '12px' }}>Status</th>
                        <th style={{ padding: '12px' }}>Time</th>
                        <th style={{ padding: '12px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {issues.length === 0 ? (
                        <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No issues found.</td></tr>
                    ) : (
                        issues.map(issue => (
                            <tr key={issue.id} style={{ borderBottom: '1px solid #475569', opacity: issue.status === 'Flagged' ? 0.7 : 1 }}>
                                <td style={{ padding: '12px' }}>{issue.category}</td>
                                <td style={{ padding: '12px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {issue.voice_text || 'No description'}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px',
                                        background: issue.status === 'Resolved' ? '#166534'
                                            : issue.status === 'In Progress' ? '#ca8a04'
                                                : issue.status === 'Flagged' ? '#525252'
                                                    : '#ef4444',
                                        color: 'white', fontSize: '0.85rem'
                                    }}>
                                        {issue.status}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>{new Date(issue.timestamp || issue.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '12px' }}>
                                    <button
                                        onClick={() => setSelectedIssue(issue)}
                                        style={{
                                            background: '#3b82f6', color: 'white',
                                            padding: '6px 12px', border: 'none',
                                            borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                                        }}
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* ISSUE DETAILS MODAL */}
            {selectedIssue && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: '#1e293b', padding: '2rem', borderRadius: '8px',
                        maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
                        position: 'relative', border: '1px solid #475569'
                    }}>
                        <button
                            onClick={() => setSelectedIssue(null)}
                            style={{
                                position: 'absolute', top: '1rem', right: '1rem',
                                background: 'transparent', border: 'none',
                                color: 'white', fontSize: '1.5rem', cursor: 'pointer'
                            }}
                        >
                            &times;
                        </button>

                        <h2 style={{ marginBottom: '1.5rem', color: '#60a5fa', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                            Issue Details
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Metadata Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px' }}>
                                    <strong style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Category</strong>
                                    <span style={{ fontSize: '1.1rem' }}>{selectedIssue.category}</span>
                                </div>
                                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px' }}>
                                    <strong style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Status</strong>
                                    <span style={{
                                        color: selectedIssue.status === 'Resolved' ? '#4ade80' : selectedIssue.status === 'In Progress' ? '#facc15' : '#f87171',
                                        fontWeight: 'bold', fontSize: '1.1rem'
                                    }}>
                                        {selectedIssue.status}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <strong style={{ color: '#e2e8f0', marginBottom: '8px', display: 'block' }}>Description</strong>
                                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px', lineHeight: '1.5', color: '#cbd5e1' }}>
                                    {selectedIssue.voice_text || 'No description provided.'}
                                </div>
                            </div>

                            {/* AI Analysis */}
                            <div>
                                <strong style={{ color: '#e2e8f0', marginBottom: '8px', display: 'block' }}>AI Analysis</strong>
                                <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '1rem', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: '#94a3b8' }}>Confidence Score:</span>
                                        <span style={{ fontWeight: 'bold', color: '#fff' }}>{(selectedIssue.ai_confidence * 100).toFixed(0)}%</span>
                                    </div>
                                    <div style={{ color: '#cbd5e1' }}>
                                        <span style={{ color: '#94a3b8', marginRight: '8px' }}>Reasoning:</span>
                                        {selectedIssue.ai_reason}
                                    </div>
                                </div>
                            </div>

                            {/* Evidence Photo Section */}
                            {selectedIssue.image && selectedIssue.image.length > 10 && (
                                <div>
                                    <strong style={{ color: '#e2e8f0', marginBottom: '8px', display: 'block' }}>Evidence Photo</strong>
                                    <div style={{
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        background: '#000',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        padding: '1rem'
                                    }}>
                                        <img
                                            src={selectedIssue.image}
                                            alt="Issue Evidence"
                                            style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain' }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Map Action Button */}
                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${selectedIssue.latitude},${selectedIssue.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        background: 'linear-gradient(to right, #f59e0b, #d97706)',
                                        color: 'white',
                                        padding: '12px 24px',
                                        textDecoration: 'none',
                                        borderRadius: '6px',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        display: 'inline-block',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        transition: 'transform 0.1s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    📍 Open Location in Google Maps
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminDashboard;
