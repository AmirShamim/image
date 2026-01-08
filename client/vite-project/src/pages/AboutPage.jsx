import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <Header />
      
      <div className="page-container">
        <div className="page-header">
          <h1>About ImageStudio</h1>
          <p>Professional image processing tools for everyone</p>
        </div>

        <section className="content-section">
          <h2>Our Mission</h2>
          <p>
            We're building accessible, professional-grade image editing tools powered by AI.
            Our goal is to make powerful image processing available to everyone, regardless 
            of technical skill or budget.
          </p>
        </section>

        <section className="content-section">
          <h2>What We Offer</h2>
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6"/>
                </svg>
              </div>
              <div>
                <h3>AI Upscaling</h3>
                <p>Enlarge images up to 4x using Real-ESRGAN technology.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                </svg>
              </div>
              <div>
                <h3>Image Resizing</h3>
                <p>Resize images to exact dimensions for any platform.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <div>
                <h3>Privacy First</h3>
                <p>Your images are encrypted and automatically deleted after processing.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="content-section">
          <h2>Technology</h2>
          <p>
            Built with React, Node.js, and Python. Our AI upscaling uses Real-ESRGAN, 
            a state-of-the-art super-resolution model that delivers professional results.
          </p>
        </section>

        <section className="cta-section">
          <h2>Get Started</h2>
          <p>Try our tools for free — no signup required.</p>
          <div className="cta-buttons">
            <Link to="/upscale" className="cta-primary">Try AI Upscaler</Link>
            <Link to="/tools" className="cta-secondary">View All Tools</Link>
          </div>
        </section>
      </div>
      
      <Footer />
    </div>
  );
};

export default AboutPage;
