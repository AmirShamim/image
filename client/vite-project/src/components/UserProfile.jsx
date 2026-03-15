import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, getImageHistory, deleteHistoryImage } from '../services/auth';
import { Crown, Search, Ruler, Upload, X, Trash2, Download } from 'lucide-react';

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="liquid-panel w-[min(400px,100%)] h-[min(86dvh,920px)] flex flex-col overflow-hidden relative pt-6 text-zinc-200" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-3.5 right-3.5 z-10 w-10 h-10 liquid-button !p-0 !rounded-xl" onClick={onClose} title="Close">
          <X className="w-5 h-5 mx-auto" />
        </button>

        <div className="border-b border-white/10 pr-14 pb-4 px-6 shrink-0">
          <div className="relative w-[92px] mx-auto mb-3.5">
            <div
              className={`w-[92px] h-[92px] rounded-[22px] border border-yellow-500/30 shadow-[0_12px_30px_rgba(0,0,0,0.45)] grid place-items-center font-bold text-3xl cursor-pointer overflow-hidden relative bg-black/40 group ${uploadingPicture ? 'opacity-70' : ''}`}
              onClick={handleProfilePictureClick}
              title="Click to change profile picture"
            >
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user?.username || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-yellow-500">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
              )}
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center text-white">
                <Upload className="w-6 h-6" />
              </div>
              {uploadingPicture && (
                <div className="absolute inset-0 grid place-items-center bg-black/50">
                  <div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                </div>
              )}
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
                className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 grid place-items-center hover:bg-red-500/20 transition-all hover:-translate-y-0.5"
                onClick={handleRemoveProfilePicture}
                disabled={uploadingPicture}
                title="Remove profile picture"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <h2 className="text-center mt-2.5 font-serif text-xl font-bold text-white">{user?.username}</h2>
          <p className="text-center mt-1 text-[13px] text-zinc-400">{user?.email}</p>
          {profileStats && (
            <div className="mt-3.5 flex justify-center">
              <span className="text-xs text-zinc-400 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                {profileStats.imageCount || 0} images processed
              </span>
            </div>
          )}
        </div>

        <div className="sticky top-0 z-10 bg-[var(--bg-dark-base)]/80 backdrop-blur-md border-b border-white/10 flex gap-2 p-4">
          <button
            className={`flex-1 h-10 rounded-xl border text-[13px] font-semibold transition-all ${activeSection === 'profile' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-[inset_0_0_0_1px_rgba(212,175,55,0.1)]' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'}`}
            onClick={() => { setActiveSection('profile'); setError(''); setSuccess(''); }}
          >
            Profile
          </button>
          <button
            className={`flex-1 h-10 rounded-xl border text-[13px] font-semibold transition-all ${activeSection === 'security' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-[inset_0_0_0_1px_rgba(212,175,55,0.1)]' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'}`}
            onClick={() => { setActiveSection('security'); setError(''); setSuccess(''); }}
          >
            Security
          </button>
          <button
            className={`flex-1 h-10 rounded-xl border text-[13px] font-semibold transition-all ${activeSection === 'history' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-[inset_0_0_0_1px_rgba(212,175,55,0.1)]' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'}`}
            onClick={() => { setActiveSection('history'); setError(''); setSuccess(''); }}
          >
            History
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-5 pb-4">
          {error && <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">{error}</div>}
          {success && <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[13px]">{success}</div>}

          {activeSection === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="grid gap-3.5">
              <div>
                <label htmlFor="profile-email" className="block mb-1.5 text-xs text-zinc-400">Email</label>
                <input
                  type="email"
                  id="profile-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-zinc-200 focus:border-yellow-500/50 focus:bg-white/10 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label htmlFor="profile-username" className="block mb-1.5 text-xs text-zinc-400">Username</label>
                <input
                  type="text"
                  id="profile-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-zinc-200 focus:border-yellow-500/50 focus:bg-white/10 outline-none transition-all"
                  required
                  pattern="[a-zA-Z0-9_]{3,30}"
                />
              </div>
              <button type="submit" className="accent-button w-full mt-2 !h-11" disabled={loading}>
                {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto"></div> : 'Update Profile'}
              </button>
            </form>
          )}

          {activeSection === 'security' && (
            <div className="grid gap-8">
              <form onSubmit={handleChangePassword} className="grid gap-3.5">
                <h3 className="font-serif text-lg font-semibold text-white mb-2">Change Password</h3>
                <div>
                  <label htmlFor="current-password" className="block mb-1.5 text-xs text-zinc-400">Current Password</label>
                  <input
                    type="password"
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-zinc-200 focus:border-yellow-500/50 focus:bg-white/10 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="block mb-1.5 text-xs text-zinc-400">New Password</label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-zinc-200 focus:border-yellow-500/50 focus:bg-white/10 outline-none transition-all"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label htmlFor="confirm-new-password" className="block mb-1.5 text-xs text-zinc-400">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirm-new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 text-zinc-200 focus:border-yellow-500/50 focus:bg-white/10 outline-none transition-all"
                    required
                  />
                </div>
                <button type="submit" className="accent-button w-full mt-2 !h-11" disabled={loading}>
                  {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto"></div> : 'Change Password'}
                </button>
              </form>

              <div className="pt-6 border-t border-white/10">
                <h3 className="font-serif text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
                {!showDeleteConfirm ? (
                  <button
                    className="w-full h-11 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-semibold hover:bg-red-500/20 transition-colors"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                    <p className="text-sm text-zinc-300 mb-3">This action cannot be undone. Enter your password to confirm.</p>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full h-11 px-3.5 mb-4 rounded-xl bg-white/5 border border-white/10 text-zinc-200 focus:border-red-500/50 focus:bg-white/10 outline-none transition-all"
                      placeholder="Enter your password"
                    />
                    <div className="flex gap-2">
                      <button className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                      <button
                        className="flex-1 h-11 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-semibold hover:bg-red-500/30 transition-colors flex justify-center items-center"
                        onClick={handleDeleteAccount}
                        disabled={loading}
                      >
                        {loading ? <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin mx-auto"></div> : 'Delete My Account'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'history' && (
            <div className="grid gap-3 max-h-[380px] overflow-hidden">
              {imageHistory.length === 0 ? (
                <div className="p-4 rounded-[18px] border border-white/10 bg-white/5 text-zinc-400 text-sm text-center">
                  <p>No image processing history yet.</p>
                  <p>Your processed images will appear here.</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-2.5 max-h-[340px] overflow-auto pr-1.5 custom-scrollbar">
                    {imageHistory.map((image) => (
                      <div key={image.id} className="grid grid-cols-[56px_1fr_auto] gap-3 items-center p-3 rounded-[18px] border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all">
                        {image.cloud_url ? (
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                            <img src={image.cloud_url} alt={image.original_filename} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-yellow-500/20 to-yellow-700/20 text-yellow-500 border border-yellow-500/30">
                            {image.operation === 'upscale' ? <Search className="w-5 h-5" /> : <Ruler className="w-5 h-5" />}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="block text-[13px] font-bold text-white truncate">{image.original_filename}</span>
                          <span className="block mt-1 text-xs text-zinc-400">
                            {image.operation} • {formatDate(image.created_at)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {image.cloud_url && (
                            <button
                              className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 grid place-items-center text-zinc-300 hover:bg-white/10 hover:border-white/20 hover:-translate-y-[1px] transition-all"
                              onClick={() => handleDownloadImage(image)}
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 grid place-items-center text-zinc-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 hover:-translate-y-[1px] transition-all"
                            onClick={() => handleDeleteImageClick(image)}
                            disabled={deletingImageId === image.id}
                            title="Delete"
                          >
                            {deletingImageId === image.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {historyPagination && historyPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between gap-2 pt-2 sticky bottom-0 mt-2 bg-gradient-to-b from-transparent via-[var(--bg-dark-base)]/80 to-[var(--bg-dark-base)] backdrop-blur-md">
                      <button
                        className="h-9 px-3.5 rounded-xl border border-white/10 bg-white/5 text-zinc-300 text-sm font-semibold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={historyPage === 1}
                        onClick={() => setHistoryPage(p => p - 1)}
                      >
                        Previous
                      </button>
                      <span className="text-xs text-zinc-400">Page {historyPage} of {historyPagination.totalPages}</span>
                      <button
                        className="h-9 px-3.5 rounded-xl border border-white/10 bg-white/5 text-zinc-300 text-sm font-semibold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="p-4 border-t border-white/10 shrink-0">
          <button className="w-full h-11 rounded-xl border border-white/10 bg-white/5 text-zinc-300 font-bold flex items-center justify-center gap-2.5 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 transition-all" onClick={handleLogout}>
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
        <div className="fixed inset-0 z-[10000] grid place-items-center p-4 bg-black/60 backdrop-blur-md" onClick={handleCancelDeleteImage}>
          <div className="w-[min(520px,100%)] rounded-[20px] bg-[var(--bg-dark-base)] border border-white/10 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.6)] liquid-card relative" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold text-white mb-2">Delete Image?</h3>
            <p className="text-[13px] text-zinc-400 leading-relaxed">
              Are you sure you want to delete <strong>{imageToDelete.original_filename}</strong>?
            </p>
            <p className="text-[13px] text-red-400 mt-1.5">This action cannot be undone.</p>
            <div className="flex gap-2.5 justify-end mt-4">
              <button
                className="h-10 px-4 rounded-xl border border-white/10 bg-white/5 text-zinc-300 font-bold hover:bg-white/10 hover:border-white/20 transition-all"
                onClick={handleCancelDeleteImage}
              >
                Cancel
              </button>
              <button
                className="h-10 px-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 hover:border-red-500/40 transition-all"
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
