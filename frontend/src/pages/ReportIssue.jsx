import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { 
    PhotoCameraRounded as CameraIcon,
    LocationOnRounded as MapIcon,
    DescriptionRounded as NoteIcon,
    MicRounded as MicIcon,
    LanguageRounded as LangIcon,
    CheckCircleRounded as VerifiedIcon,
    DeleteRounded as DeleteIcon,
    RefreshRounded as RefreshIcon,
    SendRounded as SendIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../styles/ReportIssue.css';

// Fix Leaflet Marker Icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ReportIssue = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // State
    const [stream, setStream] = useState(null);
    const [cameraError, setCameraError] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState('');
    const [description, setDescription] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [voiceLanguage, setVoiceLanguage] = useState('en-IN');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [analysisStep, setAnalysisStep] = useState(0);
    const [progress, setProgress] = useState(0);

    // Filtered Icons for UI
    const steps = [
        t('step_ai_init'),
        t('step_scanning'),
        t('step_decoding'),
        t('step_validating'),
        t('step_establishing')
    ];

    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        startCamera();
        getLocation();
        return () => stopCamera();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let interval;
        if (isSubmitting && analysisStep < steps.length) {
            interval = setInterval(() => {
                setAnalysisStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
                setProgress(prev => Math.min(prev + 20, 95));
            }, 1800);
        }
        return () => clearInterval(interval);
    }, [isSubmitting, analysisStep, steps.length]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(mediaStream);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } catch (err) {
            setCameraError(t('camera_denied'));
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            setLocationError(t('geo_not_supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => setLocationError(t('geo_unable'))
        );
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Metadata Overlay
        const timestamp = new Date().toLocaleString();
        context.globalAlpha = 0.6; context.fillStyle = "black";
        context.fillRect(10, canvas.height - 80, canvas.width - 20, 70);
        context.globalAlpha = 1.0; context.font = "20px monospace"; context.fillStyle = "white";
        context.fillText(`[OFFICIAL DATA] ${timestamp}`, 30, canvas.height - 50);
        
        const geoInfo = location 
            ? `[GPS] ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` 
            : "[GPS] ACQUIRING COORDINATES...";
        context.fillText(geoInfo, 30, canvas.height - 25);

        setCapturedImage(canvas.toDataURL('image/png'));
        stopCamera();
    };

    const handleSpeech = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert("Speech Recognition not supported.");
        
        if (isListening) {
            recognitionRef.current.stop();
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = voiceLanguage;
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (e) => setDescription(prev => prev + " " + e.results[0][0].transcript);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleSubmit = async () => {
        if (!capturedImage || !location || !description.trim()) return;
        setIsSubmitting(true);
        setAnalysisStep(0);
        setProgress(5);

        const payload = {
            image: capturedImage,
            voiceText: description,
            language: voiceLanguage,
            latitude: location.lat,
            longitude: location.lng,
            timestamp: new Date().toISOString()
        };

        try {
            const token = localStorage.getItem('token');
            const apiCall = axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/issues/report`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await new Promise(r => setTimeout(r, 8000));
            setProgress(100);
            await apiCall;
            setTimeout(() => navigate('/dashboard'), 1000);
        } catch (err) {
            alert(t('submission_failed'));
            setIsSubmitting(false);
        }
    };

    return (
        <div className="report-issue-page improved-ui">
            {isSubmitting && (
                <div className="ai-processing-overlay">
                    <div className="ai-processing-card">
                        <h3 className="ai-processing-title">{t('official_verification')}</h3>
                        <div className="progress-container-large"><div className="progress-bar-fill" style={{ width: `${progress}%` }}></div></div>
                        <p className="current-step-text">{steps[analysisStep]}</p>
                        <div className="ai-visual-scanner">
                            <div className="scan-line"></div>
                            <img src={capturedImage} alt="Scan" className="scanning-preview" />
                        </div>
                    </div>
                </div>
            )}

            <header className="gov-header">
                <div className="gov-header-content">
                    <div className="gov-emblem-ui"><NoteIcon /></div>
                    <div className="gov-header-title-section">
                        <h1 className="gov-title">CivicFix | {t('report_infra_issue')}</h1>
                        <p className="gov-subtitle">{t('smart_city_platform')}</p>
                    </div>
                    <button className="btn-cancel" onClick={() => navigate('/dashboard')}>{t('exit')}</button>
                </div>
            </header>

            <main className="report-main-grid">
                {/* LEFT COLUMN: EVIDENCE & MAP */}
                <div className="report-column left-side">
                    {/* CARD 1: UPLOAD EVIDENCE */}
                    <section className="ui-card">
                        <div className="card-header">
                            <CameraIcon className="card-icon" />
                            <h3>{t('upload_evidence')}</h3>
                        </div>
                        <div className="upload-container">
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                            {!capturedImage ? (
                                <div className="camera-view">
                                    <video ref={videoRef} autoPlay playsInline muted />
                                    <div className="dashed-overlay" onClick={capturePhoto}>
                                        <CameraIcon style={{ fontSize: 48, color: '#94a3b8' }} />
                                        <p>{t('click_capture_photo')}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="image-preview-container">
                                    <img src={capturedImage} alt="Preview" className="evidence-preview" />
                                    <div className="preview-actions">
                                        <button className="btn-secondary" onClick={() => { setCapturedImage(null); startCamera(); }}>
                                            <RefreshIcon /> {t('retake')}
                                        </button>
                                        <button className="btn-danger" onClick={() => setCapturedImage(null)}>
                                            <DeleteIcon /> {t('remove')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* CARD 2: LOCATION MAP */}
                    <section className="ui-card mt-24">
                        <div className="card-header">
                            <MapIcon className="card-icon" />
                            <h3>{t('location_map_label')}</h3>
                        </div>
                        <div className="map-preview-container">
                            {location ? (
                                <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '300px', borderRadius: '12px' }} zoomControl={false} dragging={false} touchZoom={false} scrollWheelZoom={false}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[location.lat, location.lng]} />
                                </MapContainer>
                            ) : (
                                <div className="map-placeholder">
                                    <div className="spinner-small"></div>
                                    <p>{locationError || t('detecting_gps')}</p>
                                </div>
                            )}
                        </div>
                        <div className="location-footer">
                            <div className="geo-badge">
                                <VerifiedIcon className="verified-icon" /> {t('gps_verified')}
                            </div>
                            <div className="coord-text">
                                {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : "---, ---"}
                            </div>
                            <button className="btn-text-only" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${location?.lat},${location?.lng}`, '_blank')}>
                                {t('view_full_map')} ↗
                            </button>
                        </div>
                    </section>
                </div>

                {/* RIGHT COLUMN: DESCRIPTION */}
                <div className="report-column right-side">
                    <section className="ui-card full-height">
                        <div className="card-header">
                            <NoteIcon className="card-icon" />
                            <h3>{t('describe_issue_title')}</h3>
                        </div>
                        
                        <div className="input-row">
                            <div className="lang-box">
                                <LangIcon style={{ fontSize: 20, color: '#64748B' }} />
                                <select value={voiceLanguage} onChange={(e) => setVoiceLanguage(e.target.value)}>
                                    <option value="en-IN">ENGLISH</option>
                                    <option value="hi-IN">HINDI</option>
                                    <option value="te-IN">TELUGU</option>
                                </select>
                            </div>
                            <button className={`speak-btn ${isListening ? 'active' : ''}`} onClick={handleSpeech}>
                                <MicIcon /> {isListening ? t('stop') : t('speak')}
                            </button>
                        </div>
                        
                        <div className="divider" />
                        
                        <textarea 
                            className="description-area"
                            placeholder={t('desc_placeholder')}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <p className="helper-text">{t('detail_helper_text')}</p>

                        <div className="submit-box">
                            <button 
                                className={`btn-primary-large ${(!capturedImage || !location || !description.trim() || isSubmitting) ? 'disabled' : ''}`} 
                                onClick={handleSubmit}
                                disabled={!capturedImage || !location || !description.trim() || isSubmitting}
                            >
                                <SendIcon /> {t('official_submit')}
                            </button>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ReportIssue;