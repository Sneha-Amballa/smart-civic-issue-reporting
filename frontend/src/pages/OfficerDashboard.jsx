import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import IssueMap from '../components/IssueMap';
import '../styles/Dashboard.css'; // Inherit main gov styles
import '../styles/OfficerDashboard.css';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import Loading from '../components/Loading';

const OfficerDashboard = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);

    const [viewMode, setViewMode] = useState('list');
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [selectedIssueId, setSelectedIssueId] = useState(null);
    const [resolutionImage, setResolutionImage] = useState(null);
    const [resolving, setResolving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const getLocalizedDescription = (issue) => {
        if (!issue.description) return issue.voice_text || 'No description';
        const descObject = typeof issue.description === 'object' ? issue.description : {};
        const langCode = i18n.language?.split('-')[0] || 'en';
        return descObject[langCode] || descObject['en'] || issue.voice_text || 'No description';
    };

    const getFilteredIssues = () => {
        if (!searchQuery.trim()) return issues;
        const query = searchQuery.toLowerCase();
        return issues.filter(issue => 
            issue.id.toString().toLowerCase().includes(query) ||
            issue.category.toLowerCase().includes(query) ||
            getLocalizedDescription(issue).toLowerCase().includes(query) ||
            issue.status.toLowerCase().includes(query)
        );
    };

    useEffect(() => {
        fetchIssues();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchIssues = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/officer/my-department-issues`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIssues(res.data);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (id, newStatus) => {
        if (newStatus === 'Resolved') {
            setSelectedIssueId(id);
            setShowResolveModal(true);
        } else {
            updateStatus(id, newStatus);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setResolutionImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const confirmResolution = async () => {
        if (!resolutionImage) {
            alert("Please provide a proof image (Upload).");
            return;
        }

        setResolving(true);
        
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser. We need it as proof of visit.");
            setResolving(false);
            return;
        }

        // Use a Promise to handle geolocation with timeout
        const getPosition = () => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });
        };

        try {
            const position = await getPosition();
            const { latitude, longitude } = position.coords;

            await updateStatus(selectedIssueId, 'Resolved', {
                image: resolutionImage,
                latitude,
                longitude
            });

            // If we reached here, success!
            setShowResolveModal(false);
            setResolutionImage(null);
            setSelectedIssueId(null);
        } catch (err) {
            console.error("Resolution Error:", err);
            let errMsg = "Failed to capture location or submit resolution.";
            if (err.code === 1) errMsg = "Location permission denied. Please allow location access to submit proof.";
            if (err.code === 3) errMsg = "Location request timed out. Please try again.";
            alert(errMsg);
        } finally {
            setResolving(false);
        }
    };

    const updateStatus = async (id, newStatus, extraData = {}) => {
        try {
            const token = localStorage.getItem('token');
            const payload = { status: newStatus, ...extraData };
            await axios.patch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/officer/issue/${id}/status`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchIssues();
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || 'Failed to update status';
            alert(`Error: ${errMsg}`);
        }
    };

    if (loading) return <Loading message="Accessing Department Portal" />;

    return (
        <div className="citizen-dashboard">

            {/* Standard Government Header */}
            <header className="gov-header">
                <div className="gov-header-content">
                    <div className="gov-emblem">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                            <path d="M2 17L12 22L22 17" />
                            <path d="M2 12L12 17L22 12" />
                        </svg>
                    </div>
                    
                    <div className="gov-header-title-section">
                        <h1 className="gov-title">{t('officer_portal')}</h1>
                        <p className="gov-subtitle">{t('dept_control')}</p>
                    </div>
                    
                    <div className="gov-header-actions">
                        <button className="btn btn-profile no-print" onClick={() => navigate('/officer/profile')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            {t('my_profile')}
                        </button>
                        <button className="btn btn-logout no-print" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            {t('logout')}
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-container">
                <section className="dashboard-section">
                    <div className="section-header dashboard-tabs-header">
                        <div>
                            <h2 className="section-title">{t('dept_snapshot')}</h2>
                            <p className="section-subtitle">{t('dept_snapshot_desc')}</p>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card stat-card-info">
                            <div className="stat-icon-wrap">
                                <SearchRoundedIcon />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{issues.filter(i => i.status === 'Reported').length}</div>
                                <div className="stat-label">{t('pending_review')}</div>
                                <div className="stat-meta">{t('awaiting_assignment')}</div>
                            </div>
                        </div>
                        <div className="stat-card stat-card-warning">
                            <div className="stat-icon-wrap">
                                <AssignmentRoundedIcon />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{issues.filter(i => i.status === 'Assigned' || i.status === 'In Progress').length}</div>
                                <div className="stat-label">{t('active_workload')}</div>
                                <div className="stat-meta">{t('currently_addressed')}</div>
                            </div>
                        </div>
                        <div className="stat-card stat-card-success">
                            <div className="stat-icon-wrap">
                                <CheckCircleRoundedIcon />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length}</div>
                                <div className="stat-label">{t('success_rate')}</div>
                                <div className="stat-meta">{t('completed_month')}</div>
                            </div>
                        </div>
                    </div>

                    <div className="section-header">
                        <h2 className="section-title">{t('manage_issues_title')}</h2>
                        <p className="section-subtitle">{t('manage_issues_desc')}</p>
                    </div>
                        <div className="search-filter-bar">
                            <div className="search-wrapper">
                                <input 
                                    type="text" 
                                    placeholder={t('search_placeholder')}
                                    className="search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <svg 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5" 
                                    className="search-icon"
                                >
                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                            
                            <button className="btn-icon-refresh" onClick={fetchIssues} title="Refresh issues">
                                <SyncRoundedIcon />
                            </button>

                            <div className="view-toggle">
                                <button 
                                    className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                >
                                    List View
                                </button>
                                <button 
                                    className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
                                    onClick={() => setViewMode('map')}
                                >
                                    Map View
                                </button>
                            </div>
                        </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Loading issues...</p>
                        </div>
                    ) : getFilteredIssues().length === 0 ? (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                            </svg>
                            <p>{searchQuery.trim() ? 'No issues match your search.' : 'No issues found for your department.'}</p>
                        </div>
                    ) : viewMode === 'map' ? (
                        <div className="map-container">
                            <IssueMap issues={getFilteredIssues()} height="600px" />
                        </div>
                    ) : (
                        <div className="issues-grid">
                            {getFilteredIssues().map(issue => {
                                const isAssigned = issue.status === 'Assigned';
                                // Safely format coordinates
                                const lat = issue.latitude ? Number(issue.latitude) : null;
                                const lng = issue.longitude ? Number(issue.longitude) : null;
                                const locationStr = lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'N/A';
                                // Safely format AI confidence
                                const aiConfidence = issue.ai_confidence ? (Number(issue.ai_confidence) * 100).toFixed(0) : '0';

                                 return (
                                    <div key={issue.id} className="issue-card" onClick={() => navigate(`/issue/${issue.id}`)} style={{ cursor: 'pointer' }}>
                                        <div className="issue-card-header">
                                            <div className="issue-category-group">
                                                <span className="category-text">
                                                    {t('cat_' + issue.category?.toLowerCase().replace(' ', '_'), { defaultValue: issue.category })}
                                                </span>
                                                {isAssigned && (
                                                    <span style={{ 
                                                        fontSize: '0.65rem', 
                                                        fontWeight: 800, 
                                                        color: '#059669', 
                                                        background: '#ecfdf5', 
                                                        padding: '2px 8px', 
                                                        borderRadius: '6px',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {t('assigned_to_you')}
                                                    </span>
                                                )}
                                                {issue.status === 'Reported' && (new Date() - new Date(issue.timestamp)) / (1000 * 60 * 60 * 24) > 2 && (
                                                    <span className="priority-chip">{t('high_priority')}</span>
                                                )}
                                            </div>
                                            <span className="issue-id">#{issue.id}</span>
                                        </div>

                                        <div className="issue-description">
                                            {getLocalizedDescription(issue)}
                                        </div>

                                        <div className="issue-footer-meta">
                                            <div className="meta-chips-row">
                                                <div className="info-chip">
                                                    <MyLocationRoundedIcon style={{ fontSize: '14px' }} />
                                                    {locationStr}
                                                </div>
                                                <div className="info-chip">
                                                    <SmartToyRoundedIcon style={{ fontSize: '14px' }} />
                                                    {aiConfidence}% {t('match_label')}
                                                </div>
                                                <span className={`status-badge-new status-${issue.status?.toLowerCase().replace(' ', '-')}`}>
                                                    {t('status_' + issue.status?.toLowerCase().replace(' ', '_'), { defaultValue: issue.status })}
                                                </span>
                                            </div>

                                        <div className="status-select-wrapper">
                                            <div className="issue-actions-new">
                                                <select
                                                    value={issue.status}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                                                    className="action-select"
                                                    style={{ minWidth: '160px' }}
                                                >
                                                    <option value="Reported">{t('status_reported')}</option>
                                                    <option value="Assigned">{t('status_assigned')}</option>
                                                    <option value="In Progress">{t('status_inprogress')}</option>
                                                    <option value="Resolved">{t('status_resolved')}</option>
                                                    <option value="Closed">{t('status_closed')}</option>
                                                    <option value="Rejected">{t('status_rejected')}</option>
                                                </select>
                                                {issue.image && (
                                                    <a 
                                                        href={issue.image} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="evidence-link"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <PhotoCameraRoundedIcon style={{ fontSize: '20px' }} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Resolution Modal */}
                {showResolveModal && (
                    <div className="modal-overlay">
                        <div className="modal-card modal-resolution-card">
                            <h3 className="modal-title-v4">
                                <CheckCircleRoundedIcon className="icon-success" /> 
                                {t('verify_resolution')}
                            </h3>
                            <p className="modal-subtitle-v4">{t('provide_proof_desc')}</p>

                            <div className="modal-field-v4">
                                <label className="field-label">
                                    1. {t('provide_resolution_proof') || 'Provide Resolution Proof (Image)'}
                                </label>
                                
                                {!resolutionImage && (
                                    <div className="proof-options single-option">
                                        <div className="proof-card upload-card full-width" onClick={() => document.getElementById('resolution-upload').click()}>
                                            <div className="icon-circle">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="17 8 12 3 7 8" />
                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                </svg>
                                            </div>
                                            <p>{t('upload_file') || 'Upload File'}</p>
                                        </div>
                                    </div>
                                )}

                                {resolutionImage && (
                                    <div className="preview-wrapper">
                                        <img src={resolutionImage} alt="Resolution Proof" className="proof-preview-img" />
                                        <button className="remove-proof-btn" onClick={() => setResolutionImage(null)}>✕</button>
                                    </div>
                                )}
                                <input type="file" id="resolution-upload" hidden accept="image/*" onChange={handleImageUpload} />
                            </div>

                            <div className="modal-field-v4">
                                <label className="field-label">
                                    2. {t('gps_location_label')}
                                </label>
                                <div className="location-info-pannel">
                                    <div className="loc-dot pulse"></div>
                                    <p>{t('automatic_gps_desc')}</p>
                                </div>
                            </div>

                            <div className="modal-actions-v4">
                                <button className="btn-cancel-v4" onClick={() => { setShowResolveModal(false); }}>
                                    {t('cancel')}
                                </button>
                                <button 
                                    className="btn-submit-v4" 
                                    disabled={!resolutionImage || resolving} 
                                    onClick={confirmResolution}
                                >
                                    {resolving ? <span className="loader-mini"></span> : t('submit_resolution')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default OfficerDashboard;