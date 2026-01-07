import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, getImageHistory, deleteHistoryImage } from '../services/auth';
import './Auth.css';

const UserProfile = ({ isOpen, onClose }) => {
  const { user, logout, updateProfile, changePassword, deleteAccount, uploadProfilePicture, deleteProfilePicture } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  
  // Profile form
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Delete account
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Image history
  const [imageHistory, setImageHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState(null);
  
  // Profile stats
  const [profileStats, setProfileStats] = useState(null);
  
  // Profile picture upload
  const [uploadingPicture, setUploadingPicture] = useState(false);
  
  // Image deletion
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setUsername(user.username || '');
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && activeSection === 'history') {
      loadImageHistory();
    }
  }, [isOpen, activeSection, historyPage]);

  const loadProfile = async () => {
    try {
      const response = await getProfile();
      setProfileStats(response.user);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const loadImageHistory = async () => {
    try {
      const response = await getImageHistory(historyPage);
      setImageHistory(response.images);
      setHistoryPagination(response.pagination);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateProfile({ email, username });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError('Please enter your password to confirm');
      return;
    }

    setLoading(true);
    try {
      await deleteAccount(deletePassword);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only image files are allowed (jpeg, jpg, png, gif, webp)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadingPicture(true);
    setError('');
    setSuccess('');

    try {
      await uploadProfilePicture(file);
      setSuccess('Profile picture updated successfully!');
      loadProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingPicture(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveProfilePicture = async () => {
    setUploadingPicture(true);
    setError('');
    setSuccess('');

    try {
      await deleteProfilePicture();
      setSuccess('Profile picture removed successfully!');
      loadProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleDownloadImage = (image) => {
    if (image.cloud_url) {
      // Open cloud URL in new tab to download
      window.open(image.cloud_url, '_blank');
    }
  };

  const handleDeleteImageClick = (image) => {
    setImageToDelete(image);
    setShowDeleteImageConfirm(true);
  };

  const handleCancelDeleteImage = () => {
    setImageToDelete(null);
    setShowDeleteImageConfirm(false);
  };

  const handleConfirmDeleteImage = async () => {
    if (!imageToDelete) return;

    setDeletingImageId(imageToDelete.id);
    setShowDeleteImageConfirm(false);
    
    try {
      await deleteHistoryImage(imageToDelete.id);
      // Reload the history and profile stats
      await loadImageHistory();
      await loadProfile();
      setSuccess('Image deleted successfully!');
    } catch (err) {
      setError(err.message || 'Failed to delete image');
    } finally {
      setDeletingImageId(null);
      setImageToDelete(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="profile-header">
          <div className="profile-avatar-container">
            <div 
              className={`profile-avatar ${uploadingPicture ? 'uploading' : ''}`}
              onClick={handleProfilePictureClick}
              title="Click to change profile picture"
            >
              {user?.profile_picture ? (
                <img 
                  src={user.profile_picture} 
                  alt={user?.username || 'User'} 
                  className="profile-avatar-image"
                />
              ) : (
                user?.username?.[0]?.toUpperCase() || 'U'
              )}
              <div className="profile-avatar-overlay">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </div>
              {uploadingPicture && <div className="profile-avatar-spinner"></div>}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProfilePictureChange}
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
            />
            {user?.profile_picture && (
              <button 
                className="remove-picture-btn"
                onClick={handleRemoveProfilePicture}
                disabled={uploadingPicture}
                title="Remove profile picture"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          <h2>{user?.username}</h2>
          <p>{user?.email}</p>
          {profileStats && (
            <div className="profile-stats">
              <span>{profileStats.imageCount || 0} images processed</span>
            </div>
          )}
        </div>

        <div className="profile-nav">
          <button 
            className={activeSection === 'profile' ? 'active' : ''}
            onClick={() => { setActiveSection('profile'); setError(''); setSuccess(''); }}
          >
            Profile
          </button>
          <button 
            className={activeSection === 'security' ? 'active' : ''}
            onClick={() => { setActiveSection('security'); setError(''); setSuccess(''); }}
          >
            Security
          </button>
          <button 
            className={activeSection === 'history' ? 'active' : ''}
            onClick={() => { setActiveSection('history'); setError(''); setSuccess(''); }}
          >
            History
          </button>
        </div>

        <div className="profile-content">
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          {activeSection === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="auth-form">
              <div className="auth-field">
                <label htmlFor="profile-email">Email</label>
                <input
                  type="email"
                  id="profile-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="profile-username">Username</label>
                <input
                  type="text"
                  id="profile-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  pattern="[a-zA-Z0-9_]{3,30}"
                />
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="auth-spinner"></span> : 'Update Profile'}
              </button>
            </form>
          )}

          {activeSection === 'security' && (
            <div className="security-section">
              <form onSubmit={handleChangePassword} className="auth-form">
                <h3>Change Password</h3>
                <div className="auth-field">
                  <label htmlFor="current-password">Current Password</label>
                  <input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="new-password">New Password</label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="confirm-new-password">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirm-new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? <span className="auth-spinner"></span> : 'Change Password'}
                </button>
              </form>

              <div className="danger-zone">
                <h3>Danger Zone</h3>
                {!showDeleteConfirm ? (
                  <button 
                    className="delete-account-btn"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="delete-confirm">
                    <p>This action cannot be undone. Enter your password to confirm.</p>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                    <div className="delete-actions">
                      <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                      <button 
                        className="confirm-delete"
                        onClick={handleDeleteAccount}
                        disabled={loading}
                      >
                        {loading ? <span className="auth-spinner"></span> : 'Delete My Account'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'history' && (
            <div className="history-section">
              {imageHistory.length === 0 ? (
                <div className="empty-history">
                  <p>No image processing history yet.</p>
                  <p>Your processed images will appear here.</p>
                </div>
              ) : (
                <>
                  <div className="history-list">
                    {imageHistory.map((image) => (
                      <div key={image.id} className="history-item">
                        {image.cloud_url ? (
                          <div className="history-thumbnail">
                            <img src={image.cloud_url} alt={image.original_filename} />
                          </div>
                        ) : (
                          <div className="history-icon">
                            {image.operation === 'upscale' ? '🔍' : '📐'}
                          </div>
                        )}
                        <div className="history-details">
                          <span className="history-filename">{image.original_filename}</span>
                          <span className="history-meta">
                            {image.operation} • {formatDate(image.created_at)}
                          </span>
                        </div>
                        <div className="history-actions">
                          {image.cloud_url && (
                            <button 
                              className="history-action-btn download"
                              onClick={() => handleDownloadImage(image)}
                              title="Download"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                            </button>
                          )}
                          <button 
                            className="history-action-btn delete"
                            onClick={() => handleDeleteImageClick(image)}
                            disabled={deletingImageId === image.id}
                            title="Delete"
                          >
                            {deletingImageId === image.id ? (
                              <span className="auth-spinner small"></span>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {historyPagination && historyPagination.totalPages > 1 && (
                    <div className="history-pagination">
                      <button 
                        disabled={historyPage === 1}
                        onClick={() => setHistoryPage(p => p - 1)}
                      >
                        Previous
                      </button>
                      <span>Page {historyPage} of {historyPagination.totalPages}</span>
                      <button 
                        disabled={historyPage === historyPagination.totalPages}
                        onClick={() => setHistoryPage(p => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="profile-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Delete Image Confirmation Dialog */}
      {showDeleteImageConfirm && imageToDelete && (
        <div className="confirm-dialog-overlay" onClick={handleCancelDeleteImage}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Image?</h3>
            <p>
              Are you sure you want to delete <strong>{imageToDelete.original_filename}</strong>?
            </p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="confirm-dialog-actions">
              <button 
                className="confirm-dialog-cancel"
                onClick={handleCancelDeleteImage}
              >
                Cancel
              </button>
              <button 
                className="confirm-dialog-delete"
                onClick={handleConfirmDeleteImage}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
