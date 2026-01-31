import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/home.css';
import homeImage from '../assets/home.png';

const Home = () => {
    return (
        <div className="home-page">
            {/* 1️⃣ Navbar */}
            <nav className="navbar">
                <div className="nav-container">
                    <div className="nav-logo">
                        <div className="logo-icon">
                            <svg className="logo-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#1E3A8A" />
                                <path d="M2 17L12 22L22 17" stroke="#1E3A8A" strokeWidth="2" />
                                <path d="M2 12L12 17L22 12" stroke="#1E3A8A" strokeWidth="2" />
                            </svg>
                        </div>
                        <span className="logo-text">CivicFix</span>
                    </div>
                    <div className="nav-links">
                        <Link to="/" className="nav-link active">Home</Link>
                        <a href="#about" className="nav-link">About</a>
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/signup" className="nav-link signup-btn">Sign Up</Link>
                    </div>
                </div>
            </nav>

            {/* 2️⃣ Hero Section */}
            <section id="home" className="hero-section">
                <div className="hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Report Civic Issues.<br />
                            Track Progress.<br />
                            Make Your City Better.
                        </h1>
                        <p className="hero-subtitle">
                            A smart platform for citizens to report civic problems like potholes,
                            streetlights, garbage overflow, and track their resolution transparently.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/dashboard" className="btn btn-primary">Report an Issue</Link>
                            <Link to="/login" className="btn btn-secondary">Login</Link>
                        </div>
                    </div>
                    <div className="hero-illustration">
                        <div className="illustration-placeholder">
                            <div className="illustration-content">
                                <img
                                    src={homeImage}
                                    alt="City Infrastructure"
                                    className="city-image"
                                />

                                <div className="illustration-overlay">
                                    <div className="report-badge">
                                        <svg className="report-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15L10 9L14 13L21 8V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M9 11L5 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="17" cy="12" r="2" fill="#16A34A" stroke="white" strokeWidth="2" />
                                        </svg>
                                        <span>Live Issue Reports</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3️⃣ Features Section */}
            <section id="about" className="features-section">
                <div className="section-container">
                    <h2 className="section-title">How CivicFix Works</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="13" r="4" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Easy Issue Reporting</h3>
                            <p className="feature-description">
                                Upload photo, add description & auto-detect location with our intuitive mobile and web interface.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Live Tracking</h3>
                            <p className="feature-description">
                                Track issue status in real-time. Get updates at every stage from reporting to resolution.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M19 7L21 9L23 7" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Authority Assignment</h3>
                            <p className="feature-description">
                                Issues are automatically assigned to concerned officers based on location and issue type.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4️⃣ How It Works Steps */}
            <section className="steps-section">
                <div className="section-container">
                    <h2 className="section-title">Simple 4-Step Process</h2>
                    <div className="steps-container">
                        <div className="step">
                            <div className="step-number">1</div>
                            <div className="step-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M17 11L19 13L23 9" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="step-title">Register / Login</h3>
                            <p className="step-description">Create your account or sign in to get started</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <div className="step-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="13" r="4" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="step-title">Report Issue</h3>
                            <p className="step-description">Submit issue with photo, description & location</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <div className="step-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14 7L9 12L14 17" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M21 12C21 13.1819 20.7672 14.3522 20.3149 15.4442C19.8626 16.5361 19.1997 17.5282 18.364 18.364C17.5282 19.1997 16.5361 19.8626 15.4442 20.3149C14.3522 20.7672 13.1819 21 12 21C10.8181 21 9.64778 20.7672 8.55585 20.3149C7.46392 19.8626 6.47177 19.1997 5.63604 18.364C4.80031 17.5282 4.13738 16.5361 3.68508 15.4442C3.23279 14.3522 3 13.1819 3 12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12Z" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="step-title">Authorities Fix</h3>
                            <p className="step-description">Concerned department takes action to resolve</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step">
                            <div className="step-number">4</div>
                            <div className="step-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 22 12 22C11.6496 22 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className="step-title">Get Notified</h3>
                            <p className="step-description">Receive updates and provide feedback</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5️⃣ Call to Action */}
            <section className="cta-section">
                <div className="cta-container">
                    <div className="cta-content">
                        <h2 className="cta-title">Be a responsible citizen.<br />Help improve your city today.</h2>
                        <div className="cta-buttons">
                            <Link to="/signup" className="btn btn-primary">Sign Up</Link>
                            <Link to="/dashboard" className="btn btn-secondary">Report Issue</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6️⃣ Footer */}
            <footer className="footer">
                <div className="footer-container">
                    <div className="footer-logo">
                        <div className="logo-icon">
                            <svg className="logo-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#1E3A8A" />
                                <path d="M2 17L12 22L22 17" stroke="#1E3A8A" strokeWidth="2" />
                                <path d="M2 12L12 17L22 12" stroke="#1E3A8A" strokeWidth="2" />
                            </svg>
                        </div>
                        <span className="logo-text">CivicFix</span>
                    </div>
                    <div className="footer-links">
                        <a href="#contact" className="footer-link">Contact</a>
                        <a href="#privacy" className="footer-link">Privacy</a>
                        <a href="#terms" className="footer-link">Terms</a>
                        <a href="#faq" className="footer-link">FAQ</a>
                    </div>
                    <div className="footer-copyright">
                        © 2026 CivicFix. Developed for Government of India (demo text)
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home; 