import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Shield,
  Camera,
  Upload,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  Mail,
  Lock,
} from 'lucide-react';
import { userApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') === 'security' ? 'security' : 'branding';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with query params
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Profile Details State
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Avatar State
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  // Cover Image State
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef(null);

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    if (user) {
      setFullname(user.fullname || '');
      setEmail(user.email || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In to Access Settings</h2>
        <p className="text-sm text-slate-400">Please sign in to update your profile, branding, and security settings.</p>
        <Link to="/auth" className="inline-block px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  // Handle Avatar Selection
  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Handle Avatar Upload
  const handleSaveAvatar = async () => {
    if (!avatarFile) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      await userApi.updateAvatar(formData);
      await refreshUser();
      setAvatarFile(null);
      setAvatarPreview(null);
      addToast('Avatar updated successfully!');
    } catch (err) {
      addToast(err.message || 'Failed to update avatar', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle Cover Image Selection
  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // Handle Cover Image Upload
  const handleSaveCover = async () => {
    if (!coverFile) return;
    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append('coverImage', coverFile);
      await userApi.updateCoverImage(formData);
      await refreshUser();
      setCoverFile(null);
      setCoverPreview(null);
      addToast('Channel banner updated successfully!');
    } catch (err) {
      addToast(err.message || 'Failed to update banner', 'error');
    } finally {
      setCoverUploading(false);
    }
  };

  // Handle Profile Details Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError(null);
    if (!fullname.trim() || !email.trim()) {
      setProfileError('Full name and email are required');
      return;
    }

    setProfileSaving(true);
    try {
      await userApi.updateAccount({
        fullname: fullname.trim(),
        email: email.trim().toLowerCase(),
      });
      await refreshUser();
      addToast('Profile details updated successfully!');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (!oldPassword || !newPassword) {
      setPasswordError('Please fill in both current and new password');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      await userApi.changePassword({
        oldPassword,
        newPassword,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Password changed successfully!');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">Settings</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 pl-9">
            Customize your channel appearance, profile information, and account security.
          </p>
        </div>

        <Link
          to={`/channel/${user.username}`}
          className="self-start sm:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 border border-slate-700/60"
        >
          <User className="w-3.5 h-3.5" />
          <span>View Channel</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800">
        <button
          onClick={() => handleTabChange('branding')}
          className={`pb-3 border-b-2 font-semibold text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'branding'
              ? 'border-red-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile & Branding</span>
        </button>
        <button
          onClick={() => handleTabChange('security')}
          className={`pb-3 border-b-2 font-semibold text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-red-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security & Password</span>
        </button>
      </div>

      {/* TAB 1: Profile & Branding */}
      {activeTab === 'branding' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Channel Banner / Cover Image */}
          <div className="bg-[#151722] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Channel Banner</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                This image is displayed at the top of your channel page. Recommended: 1920x1080 or minimum 1280x360.
              </p>
            </div>

            <div className="relative w-full aspect-4/1 sm:aspect-5/1 min-h-30 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 group">
              <img
                src={coverPreview || user.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1280&q=80'}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
              <div
                onClick={() => coverInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer gap-2 text-white text-xs font-semibold backdrop-blur-xs"
              >
                <Camera className="w-5 h-5" />
                <span>Click to change banner</span>
              </div>
            </div>

            <input
              type="file"
              ref={coverInputRef}
              onChange={handleCoverSelect}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors border border-slate-700/60 flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Choose Image</span>
              </button>

              {coverFile && (
                <>
                  <button
                    type="button"
                    disabled={coverUploading}
                    onClick={handleSaveCover}
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-md shadow-red-600/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{coverUploading ? 'Uploading...' : 'Save Banner'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Avatar / Profile Picture */}
          <div className="bg-[#151722] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Profile Picture</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Your profile picture appears next to your videos, comments, and on your channel.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
              <div className="relative group/avatar cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <img
                  src={avatarPreview || user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=channel'}
                  alt="Avatar preview"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-slate-800 shadow-xl"
                />
                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-xs">
                  <Camera className="w-6 h-6" />
                </div>
              </div>

              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarSelect}
                accept="image/*"
                className="hidden"
              />

              <div className="space-y-3 text-center sm:text-left flex-1">
                <p className="text-xs text-slate-400">
                  Recommended: Square picture at least 250x250 pixels. PNG, JPG, or WebP.
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors border border-slate-700/60 flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Picture</span>
                  </button>

                  {avatarFile && (
                    <>
                      <button
                        type="button"
                        disabled={avatarUploading}
                        onClick={handleSaveAvatar}
                        className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-md shadow-red-600/20"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{avatarUploading ? 'Uploading...' : 'Save Picture'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(null);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Details Form */}
          <div className="bg-[#151722] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Personal Information</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your display name and registered email address.
              </p>
            </div>

            {profileError && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username
                </label>
                <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-400 cursor-not-allowed">
                  <span>@{user.username}</span>
                  <span className="ml-auto text-xs text-slate-500 font-mono">Unique ID</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="w-full bg-[#1c1f2e] border border-slate-700/60 focus:border-red-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1c1f2e] border border-slate-700/60 focus:border-red-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 pt-2"
              >
                <Save className="w-4 h-4" />
                <span>{profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="bg-[#151722] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Change Password</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ensure your account is using a strong, unique password to stay secure.
              </p>
            </div>

            {passwordError && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-[#1c1f2e] border border-slate-700/60 focus:border-red-500 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#1c1f2e] border border-slate-700/60 focus:border-red-500 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#1c1f2e] border border-slate-700/60 focus:border-red-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 pt-2"
              >
                <Save className="w-4 h-4" />
                <span>{passwordSaving ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
