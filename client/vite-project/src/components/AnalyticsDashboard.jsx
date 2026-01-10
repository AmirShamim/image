/**
 * Analytics Dashboard Component
 *
 * Admin-only dashboard showing website usage statistics
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AnalyticsDashboard.css';

const API_URL = '';

const AnalyticsDashboard = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [realtime, setRealtime] = useState(null);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;

    fetchStats();
    fetchRealtime();

    // Refresh realtime stats every 30 seconds
    const interval = setInterval(fetchRealtime, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/analytics/stats?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtime = async () => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/realtime`);
      if (response.ok) {
        const data = await response.json();
        setRealtime(data);
      }
    } catch (err) {
      console.debug('Realtime fetch error:', err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-error">
          <h2>🔒 Access Denied</h2>
          <p>Analytics dashboard is only available to administrators.</p>
        </div>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-error">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button onClick={fetchStats}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h1>📊 Analytics Dashboard</h1>
        <div className="period-selector">
          <button
            className={period === '7d' ? 'active' : ''}
            onClick={() => setPeriod('7d')}
          >
            7 Days
          </button>
          <button
            className={period === '30d' ? 'active' : ''}
            onClick={() => setPeriod('30d')}
          >
            30 Days
          </button>
          <button
            className={period === '90d' ? 'active' : ''}
            onClick={() => setPeriod('90d')}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Realtime Stats */}
      {realtime && (
        <div className="realtime-bar">
          <div className="realtime-indicator">
            <span className="pulse"></span>
            <span>Live</span>
          </div>
          <div className="realtime-stats">
            <span><strong>{realtime.activeVisitors}</strong> active now</span>
            <span><strong>{realtime.hourlyViews}</strong> views/hour</span>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Visitors</h3>
            <p className="stat-value">{stats?.totalVisitors?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Period Visitors</h3>
            <p className="stat-value">{stats?.periodVisitors?.toLocaleString() || 0}</p>
            <p className="stat-subtitle">Last {period}</p>
          </div>
        </div>

        <div className="stat-card highlight-green">
          <div className="stat-icon">🆕</div>
          <div className="stat-content">
            <h3>New Visitors</h3>
            <p className="stat-value">{stats?.newVisitors?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="stat-card highlight-blue">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>Returning</h3>
            <p className="stat-value">{stats?.returningVisitors?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <h3>Page Views</h3>
            <p className="stat-value">{stats?.pageViews?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      {/* Tool Usage */}
      <div className="analytics-section">
        <h2>🛠️ Tool Usage</h2>
        <div className="tool-usage-grid">
          {stats?.toolUsage?.length > 0 ? (
            stats.toolUsage.map((tool, index) => (
              <div key={index} className="tool-card">
                <div className="tool-icon">
                  {tool.tool_name === 'resize' && '📐'}
                  {tool.tool_name === 'upscale' && '🔍'}
                  {tool.tool_name === 'batch' && '📦'}
                  {!['resize', 'upscale', 'batch'].includes(tool.tool_name) && '⚙️'}
                </div>
                <div className="tool-info">
                  <h4>{tool.tool_name}</h4>
                  <p>{tool.count} uses</p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No tool usage data yet</p>
          )}
        </div>
      </div>

      {/* Top Pages */}
      <div className="analytics-section">
        <h2>📄 Top Pages</h2>
        <div className="top-pages-list">
          {stats?.topPages?.length > 0 ? (
            stats.topPages.map((page, index) => (
              <div key={index} className="page-item">
                <span className="page-rank">#{index + 1}</span>
                <span className="page-path">{page.page_path || '/'}</span>
                <span className="page-views">{page.views} views</span>
              </div>
            ))
          ) : (
            <p className="no-data">No page view data yet</p>
          )}
        </div>
      </div>

      {/* Device & Browser Breakdown */}
      <div className="analytics-row">
        <div className="analytics-section half">
          <h2>📱 Devices</h2>
          <div className="breakdown-list">
            {stats?.devices?.length > 0 ? (
              stats.devices.map((device, index) => (
                <div key={index} className="breakdown-item">
                  <span className="breakdown-label">
                    {device.device_type === 'desktop' && '🖥️'}
                    {device.device_type === 'mobile' && '📱'}
                    {device.device_type === 'tablet' && '📱'}
                    {!['desktop', 'mobile', 'tablet'].includes(device.device_type) && '❓'}
                    {' '}{device.device_type || 'unknown'}
                  </span>
                  <span className="breakdown-value">{device.count}</span>
                </div>
              ))
            ) : (
              <p className="no-data">No device data yet</p>
            )}
          </div>
        </div>

        <div className="analytics-section half">
          <h2>🌐 Browsers</h2>
          <div className="breakdown-list">
            {stats?.browsers?.length > 0 ? (
              stats.browsers.map((browser, index) => (
                <div key={index} className="breakdown-item">
                  <span className="breakdown-label">
                    {browser.browser === 'chrome' && '🔵'}
                    {browser.browser === 'firefox' && '🦊'}
                    {browser.browser === 'safari' && '🧭'}
                    {browser.browser === 'edge' && '🌐'}
                    {!['chrome', 'firefox', 'safari', 'edge'].includes(browser.browser) && '🔘'}
                    {' '}{browser.browser || 'unknown'}
                  </span>
                  <span className="breakdown-value">{browser.count}</span>
                </div>
              ))
            ) : (
              <p className="no-data">No browser data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="analytics-section">
        <h2>📈 Daily Trend</h2>
        <div className="trend-chart">
          {stats?.dailyTrend?.length > 0 ? (
            <div className="simple-chart">
              {stats.dailyTrend.map((day, index) => {
                const maxViews = Math.max(...stats.dailyTrend.map(d => d.page_views || 0));
                const height = maxViews > 0 ? ((day.page_views || 0) / maxViews) * 100 : 0;
                return (
                  <div key={index} className="chart-bar-container">
                    <div
                      className="chart-bar"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${day.date}: ${day.page_views} views, ${day.visitors} visitors`}
                    >
                      <span className="bar-value">{day.page_views || 0}</span>
                    </div>
                    <span className="bar-label">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-data">No trend data yet</p>
          )}
        </div>
      </div>

      <div className="analytics-footer">
        <p>Last updated: {new Date().toLocaleString()}</p>
        <button onClick={fetchStats} className="refresh-btn">🔄 Refresh</button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

