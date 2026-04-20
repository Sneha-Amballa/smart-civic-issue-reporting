import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
    VerifiedRounded as VerifiedIcon,
    LocationOnRounded as MapIcon,
    CalendarTodayRounded as DateIcon,
    CategoryRounded as CategoryIcon,
    ArrowBackRounded as BackIcon,
    CheckCircleRounded as CheckIcon
} from '@mui/icons-material';
import Loading from '../components/Loading';
import '../styles/IssueDetails.css';


// Fix Leaflet Marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const IssueDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const [issue, setIssue] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIssueDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchIssueDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIssue(response.data);
            setComments(response.data.comments || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/${id}/comment`, {
                comment: newComment
            }, { headers: { Authorization: `Bearer ${token}` } });
            setNewComment('');
            fetchIssueDetails();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <Loading message={t('fetch_record_details')} />;

    if (!issue) return <div className="error-state">{t('issue_not_found')}</div>;

    const confidenceScore = issue.ai_confidence ? (issue.ai_confidence * 100).toFixed(0) : 0;
    const isVerified = issue.ai_status === 'Verified' || issue.ai_status === 'CATEGORIZED';

    return (
        <div className="issue-details-page-v4">
            {/* TOP HEADER */}
            <header className="details-header-v4">
                <div className="header-left">
                    <button className="btn-back-crumb" onClick={() => navigate('/dashboard')}>
                        <BackIcon style={{ fontSize: 18 }} /> {t('dashboard')}
                    </button>
                    <span className="crumb-sep">/</span>
                    <h1 className="id-title">{t('id_label')} #{issue.id}</h1>
                    <div className="summary-pills">
                        <span className="pill pill-category"><div className="dot-blue"></div> {issue.category}</span>
                        <span className="pill pill-coords"><MapIcon style={{ fontSize: 14 }} /> {Number(issue.latitude).toFixed(4)}, {Number(issue.longitude).toFixed(4)}</span>
                    </div>
                </div>
                <div className={`badge-status-top status-${issue.status?.toLowerCase().replace(' ', '-')}`}>
                    <div className="dot"></div> {issue.status}
                </div>
            </header>

            <main className="details-grid-v4">
                {/* LEFT COLUMN: EVIDENCE & DISCUSSION */}
                <div className="details-left">
                    {/* EVIDENCE CARD */}
                    <div className="evidence-card-v4">
                        <div className="tag-float-left">Official evidence</div>
                        <img src={issue.image} alt="Evidence" className="evidence-main-img" />
                        <div className="meta-float-bottom">
                            <div className="time-gps">
                                <div>{new Date(issue.timestamp).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                <div className="gps-acquiring">GPS acquiring...</div>
                            </div>
                            <div className="verified-pill">
                                <div className="dot-green"></div> Verified
                            </div>
                        </div>
                    </div>

                    {/* ISSUE DESCRIPTION & AI VERIFIED */}
                    <div className="card-v4 desc-ai-card">
                        <div className="desc-header">{t('issue_description_label')}</div>
                        <p className="desc-text-v4">
                            {(() => {
                                const descObject = typeof issue.description === 'object' ? issue.description : {};
                                const langCode = i18n.language?.split('-')[0] || 'en';
                                return descObject[langCode] || descObject['en'] || issue.translated_description || issue.voice_text || t('no_description_provided');
                            })()}
                        </p>
                        
                        {issue.translated_description && issue.voice_text && issue.translated_description !== issue.voice_text && (
                            <div className="translation-box">
                                <span className="translation-label">{t('official_translation_label')} ({issue.original_language || issue.language || 'en'}):</span>
                                <p className="translated-text-v4">{issue.voice_text}</p>
                            </div>
                        )}

                        <div className="divider-line" />
                        <div className={`ai-verification-box ${isVerified ? 'verified-bg' : 'pending-bg'}`}>
                            <div className="ai-box-left">
                                {isVerified ? <CheckIcon className="check-success" /> : <VerifiedIcon className="check-pending" />}
                                <span>
                                    <strong>{isVerified ? t('ai_verified_label') : t('manual_review_label')}</strong> · {confidenceScore}% {t('confidence_label')}
                                </span>
                            </div>
                            <div className="ai-box-right">
                                {issue.ai_reason ? (
                                    <div className="ai-reason-log">
                                        {issue.ai_reason.split('\n').filter(l => l.trim()).map((line, idx) => {
                                            const [prefix, ...rest] = line.split(':');
                                            const content = rest.join(':').trim();
                                            const translatedPrefix = prefix.toLowerCase().includes('scene') ? t('scene_prefix') :
                                                                    prefix.toLowerCase().includes('category') ? t('category_prefix') :
                                                                    prefix.toLowerCase().includes('confidence') ? t('confidence_prefix') :
                                                                    prefix.toLowerCase().includes('reason') ? t('reason_prefix') : prefix;
                                            
                                            return (
                                                <div key={idx} className="ai-log-line">
                                                    <strong>{translatedPrefix}:</strong> {content}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    isVerified ? t('visual_patterns_match') : t('awaiting_verification')
                                )}
                            </div>
                            <div className="ai-progress-v4">
                                <div className={`ai-fill-v4 ${isVerified ? 'bg-success' : 'bg-pending'}`} style={{ width: `${confidenceScore}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* COMMUNITY UPDATES */}
                    <div className="card-v4 card-evidence">
                        <div className="card-header-v4">
                            <h2>{t('evidence_discussion')}</h2>
                        </div>
                        <span className="update-count">{comments.length} {t('updates')}</span>
                        <div className="comment-area-v4">
                            <textarea 
                                placeholder={t('share_observation')} 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <div className="btn-row-v4">
                                <button className="btn-post-v4" onClick={handleCommentSubmit}>{t('post_update')}</button>
                            </div>
                        </div>

                        {comments.length > 0 && (
                            <div className="comments-list-v4">
                                {comments.map((c) => (
                                    <div key={c.id} className="comment-item-v4">
                                        <div className="comment-avatar">
                                            {c.name ? c.name[0].toUpperCase() : 'U'}
                                        </div>
                                        <div className="comment-content">
                                            <div className="comment-header-v4">
                                                <span className="comment-author">{c.name}</span>
                                                {c.role === 'officer' && <span className="comment-badge">{t('field_officer_label')}</span>}
                                                {c.role === 'admin' && <span className="comment-badge" style={{background: '#FEE2E2', color: '#991B1B'}}>{t('admin_access')}</span>}
                                                <span className="comment-time">
                                                    {new Date(c.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="comment-text">{c.comment}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: UNIFIED CONTROL PANEL */}
                <div className="details-right">
                    {/* LOCATION CARD (Separate because it has a map) */}
                    <div className="card-v4 right-item location-box">
                        <div className="right-label">{t('location_label')}</div>
                        <div className="mini-map-v4">
                            <MapContainer center={[Number(issue.latitude), Number(issue.longitude)]} zoom={15} style={{ height: '120px' }} zoomControl={false} dragging={false} scrollWheelZoom={false}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[Number(issue.latitude), Number(issue.longitude)]} />
                            </MapContainer>
                            <div className="map-overlay-coord">{Number(issue.latitude).toFixed(4)}, {Number(issue.longitude).toFixed(4)} ↗</div>
                        </div>
                    </div>

                    {/* UNIFIED METADATA CARD */}
                    <div className="card-v4 unified-meta-box">
                        <div className="meta-section">
                            <div className="right-label">{t('reported_on_label')}</div>
                            <div className="date-time-bold">{new Date(issue.timestamp).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : i18n.language === 'hi' ? 'hi-IN' : 'te-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div className="time-sub">{new Date(issue.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {t('local_time') || 'local time'}</div>
                        </div>
                        
                        <div className="section-divider" />

                        <div className="meta-section">
                            <div className="right-label">{t('category_label')}</div>
                            <div className="pill-category-card">
                                {t('cat_' + issue.category.toLowerCase().replace(' ', '_'), { defaultValue: issue.category })}
                            </div>
                        </div>

                        <div className="section-divider" />

                        <div className="meta-section">
                            <div className="right-label">{t('status_label')}</div>
                            <div className={`status-flat status-color-${issue.status?.toLowerCase().replace(' ', '-')}`}>
                                <div className="dot"></div> {t('status_' + issue.status?.toLowerCase().replace(' ', '_'), { defaultValue: issue.status })}
                            </div>
                        </div>

                        <div className="section-divider" />

                        <div className="meta-section">
                            <div className="right-label">{t('assigned_to_label')}</div>
                            <div className="officer-row-v4">
                                <div className="officer-avatar-v4">{issue.officer_name?.[0] || 'S'}</div>
                                <div className="officer-meta-v4">
                                    <div className="officer-name-v4">{issue.officer_name || t('unassigned_label')}</div>
                                    <div className="officer-role-v4">{t('field_officer_label')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default IssueDetails;