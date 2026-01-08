import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './APIPage.css';

const APIPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/upscale',
      description: 'Upscale an image using AI',
      params: [
        { name: 'image', type: 'file', required: true, description: 'Image file to upscale (max 25MB)' },
        { name: 'scale', type: 'string', required: false, description: '2x or 4x (default: 2x)' }
      ],
      example: `curl -X POST https://api.imagestudio.app/v1/upscale \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg" \\
  -F "scale=2x"`
    },
    {
      method: 'POST',
      path: '/api/v1/resize',
      description: 'Resize an image to specific dimensions',
      params: [
        { name: 'image', type: 'file', required: true, description: 'Image file to resize' },
        { name: 'width', type: 'integer', required: false, description: 'Target width in pixels' },
        { name: 'height', type: 'integer', required: false, description: 'Target height in pixels' },
        { name: 'maintain_aspect', type: 'boolean', required: false, description: 'Keep aspect ratio (default: true)' }
      ],
      example: `curl -X POST https://api.imagestudio.app/v1/resize \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg" \\
  -F "width=800" \\
  -F "height=600"`
    },
    {
      method: 'POST',
      path: '/api/v1/compress',
      description: 'Compress an image to reduce file size',
      params: [
        { name: 'image', type: 'file', required: true, description: 'Image file to compress' },
        { name: 'quality', type: 'integer', required: false, description: 'Quality level 1-100 (default: 80)' }
      ],
      example: `curl -X POST https://api.imagestudio.app/v1/compress \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg" \\
  -F "quality=75"`
    },
    {
      method: 'POST',
      path: '/api/v1/remove-background',
      description: 'Remove background from an image',
      params: [
        { name: 'image', type: 'file', required: true, description: 'Image file to process' },
        { name: 'format', type: 'string', required: false, description: 'Output format: png or jpg (default: png)' }
      ],
      example: `curl -X POST https://api.imagestudio.app/v1/remove-background \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@product.jpg" \\
  -F "format=png"`
    },
    {
      method: 'POST',
      path: '/api/v1/convert',
      description: 'Convert image to different format',
      params: [
        { name: 'image', type: 'file', required: true, description: 'Image file to convert' },
        { name: 'format', type: 'string', required: true, description: 'Target format: jpg, png, webp, avif' }
      ],
      example: `curl -X POST https://api.imagestudio.app/v1/convert \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.png" \\
  -F "format=webp"`
    },
    {
      method: 'GET',
      path: '/api/v1/usage',
      description: 'Get your current API usage and limits',
      params: [],
      example: `curl -X GET https://api.imagestudio.app/v1/usage \\
  -H "Authorization: Bearer YOUR_API_KEY"`
    }
  ];

  const sdkExamples = {
    javascript: `// Install: npm install imagestudio-sdk

import ImageStudio from 'imagestudio-sdk';

const client = new ImageStudio('YOUR_API_KEY');

// Upscale an image
const result = await client.upscale({
  image: fs.readFileSync('photo.jpg'),
  scale: '2x'
});

fs.writeFileSync('upscaled.jpg', result.data);`,

    python: `# Install: pip install imagestudio

from imagestudio import ImageStudio

client = ImageStudio('YOUR_API_KEY')

# Upscale an image
result = client.upscale(
    image='photo.jpg',
    scale='2x'
)

result.save('upscaled.jpg')`,

    php: `<?php
// Install: composer require imagestudio/sdk

use ImageStudio\\Client;

$client = new Client('YOUR_API_KEY');

// Upscale an image
$result = $client->upscale([
    'image' => 'photo.jpg',
    'scale' => '2x'
]);

file_put_contents('upscaled.jpg', $result->getData());`
  };

  return (
    <div className="api-page">
      <Header />
      
      <div className="api-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        <h1>API Documentation</h1>
        <p>Integrate Image Studio into your applications</p>
      </div>

      <div className="api-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'endpoints' ? 'active' : ''}
          onClick={() => setActiveTab('endpoints')}
        >
          Endpoints
        </button>
        <button 
          className={activeTab === 'sdks' ? 'active' : ''}
          onClick={() => setActiveTab('sdks')}
        >
          SDKs
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="api-content">
          <section className="api-section">
            <h2>Getting Started</h2>
            <p>
              The Image Studio API allows you to integrate powerful image processing 
              capabilities into your applications. All API requests require authentication 
              using your API key.
            </p>
            
            <div className="info-box">
              <h4>📌 API Key Required</h4>
              <p>
                API access is available on the <strong>Business plan</strong> ($14.99/mo).
                <Link to="/pricing"> Upgrade to get your API key →</Link>
              </p>
            </div>
          </section>

          <section className="api-section">
            <h2>Authentication</h2>
            <p>Include your API key in the Authorization header:</p>
            <pre className="code-block">
{`Authorization: Bearer YOUR_API_KEY`}
            </pre>
          </section>

          <section className="api-section">
            <h2>Base URL</h2>
            <pre className="code-block">
{`https://api.imagestudio.app/v1`}
            </pre>
          </section>

          <section className="api-section">
            <h2>Rate Limits</h2>
            <table className="api-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Requests/Minute</th>
                  <th>Requests/Day</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Business</td>
                  <td>60</td>
                  <td>10,000</td>
                </tr>
                <tr>
                  <td>Enterprise</td>
                  <td>300</td>
                  <td>Unlimited</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="api-section">
            <h2>Response Format</h2>
            <p>All endpoints return JSON responses:</p>
            <pre className="code-block">
{`{
  "success": true,
  "data": {
    "url": "https://cdn.imagestudio.app/processed/abc123.jpg",
    "width": 1920,
    "height": 1080,
    "size": 245678
  }
}`}
            </pre>
          </section>

          <section className="api-section">
            <h2>Error Handling</h2>
            <pre className="code-block">
{`{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You have exceeded your rate limit. Please wait 60 seconds."
  }
}`}
            </pre>
            <h4>Error Codes</h4>
            <table className="api-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>UNAUTHORIZED</td><td>Invalid or missing API key</td></tr>
                <tr><td>RATE_LIMIT_EXCEEDED</td><td>Too many requests</td></tr>
                <tr><td>FILE_TOO_LARGE</td><td>Image exceeds size limit</td></tr>
                <tr><td>INVALID_FORMAT</td><td>Unsupported image format</td></tr>
                <tr><td>PROCESSING_ERROR</td><td>Failed to process image</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      )}

      {activeTab === 'endpoints' && (
        <div className="api-content">
          <div className="endpoints-list">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="endpoint-card">
                <div className="endpoint-header">
                  <span className={`method-badge ${endpoint.method.toLowerCase()}`}>
                    {endpoint.method}
                  </span>
                  <code className="endpoint-path">{endpoint.path}</code>
                </div>
                <p className="endpoint-desc">{endpoint.description}</p>
                
                {endpoint.params.length > 0 && (
                  <div className="endpoint-params">
                    <h4>Parameters</h4>
                    <table className="params-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Required</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {endpoint.params.map((param, idx) => (
                          <tr key={idx}>
                            <td><code>{param.name}</code></td>
                            <td>{param.type}</td>
                            <td>{param.required ? 'Yes' : 'No'}</td>
                            <td>{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="endpoint-example">
                  <h4>Example</h4>
                  <pre className="code-block">{endpoint.example}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'sdks' && (
        <div className="api-content">
          <section className="api-section">
            <h2>Official SDKs</h2>
            <p>We provide official SDKs for popular programming languages:</p>
          </section>

          <div className="sdk-cards">
            <div className="sdk-card">
              <div className="sdk-header">
                <span className="sdk-icon">🟨</span>
                <h3>JavaScript / Node.js</h3>
              </div>
              <pre className="code-block">{sdkExamples.javascript}</pre>
              <a href="#" className="sdk-link">View on npm →</a>
            </div>

            <div className="sdk-card">
              <div className="sdk-header">
                <span className="sdk-icon">🐍</span>
                <h3>Python</h3>
              </div>
              <pre className="code-block">{sdkExamples.python}</pre>
              <a href="#" className="sdk-link">View on PyPI →</a>
            </div>

            <div className="sdk-card">
              <div className="sdk-header">
                <span className="sdk-icon">🐘</span>
                <h3>PHP</h3>
              </div>
              <pre className="code-block">{sdkExamples.php}</pre>
              <a href="#" className="sdk-link">View on Packagist →</a>
            </div>
          </div>

          <div className="info-box">
            <h4>🔧 Need a different SDK?</h4>
            <p>
              Our REST API works with any programming language. 
              Check the Endpoints tab for raw HTTP examples.
            </p>
          </div>
        </div>
      )}

      <div className="api-cta">
        <h3>Ready to integrate?</h3>
        <p>Get your API key with a Business subscription</p>
        <Link to="/pricing" className="cta-button">Get API Access</Link>
      </div>
      
      <Footer />
    </div>
  );
};

export default APIPage;
