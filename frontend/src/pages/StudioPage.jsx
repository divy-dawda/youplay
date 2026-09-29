import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Eye,
  Video as VideoIcon,
  Users,
  ThumbsUp,
  Trash2,
  Globe,
  Lock,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { dashboardApi, videoApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatViews, formatTimeAgo, formatFileSize } from '../utils/format';

const MAX_VIDEO_SIZE_MB = 100;
const MAX_VIDEO_SIZE = MAX_VIDEO_SIZE_MB * 1024 * 1024; // 100 MB (Cloudinary Free tier limit)
const MAX_THUMBNAIL_SIZE_MB = 10;
const MAX_THUMBNAIL_SIZE = MAX_THUMBNAIL_SIZE_MB * 1024 * 1024; // 10 MB

export default function StudioPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalSubscribers: 0,
    totalLikes: 0,
  });
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const [thumbnailError, setThumbnailError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchStudioData = async () => {
    setLoading(true);
    try {
      const [statsRes, videosRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getVideos(),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (videosRes?.data) setVideos(videosRes.data);
    } catch (err) {
      console.error('Error fetching studio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStudioData();
    }
  }, [user]);

  const resetUploadModal = () => {
    setShowUploadModal(false);
    setTitle('');
    setDescription('');
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoError(null);
    setThumbnailError(null);
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setVideoFile(null);
      setVideoError(null);
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      const sizeStr = formatFileSize(file.size);
      const msg = `File size (${sizeStr}) exceeds the ${MAX_VIDEO_SIZE_MB} MB limit allowed by Cloudinary. Please choose a smaller video.`;
      setVideoError(msg);
      setVideoFile(null);
      e.target.value = '';
      addToast(msg, 'error');
      return;
    }

    setVideoError(null);
    setVideoFile(file);
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setThumbnailFile(null);
      setThumbnailError(null);
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      const sizeStr = formatFileSize(file.size);
      const msg = `Thumbnail size (${sizeStr}) exceeds the ${MAX_THUMBNAIL_SIZE_MB} MB limit.`;
      setThumbnailError(msg);
      setThumbnailFile(null);
      e.target.value = '';
      addToast(msg, 'error');
      return;
    }

    setThumbnailError(null);
    setThumbnailFile(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !videoFile || !thumbnailFile) {
      addToast('Please fill all fields and select both video and thumbnail files', 'error');
      return;
    }

    if (videoFile.size > MAX_VIDEO_SIZE) {
      addToast(`Video exceeds the ${MAX_VIDEO_SIZE_MB} MB limit (${formatFileSize(videoFile.size)}). Please choose a smaller video.`, 'error');
      return;
    }

    if (thumbnailFile.size > MAX_THUMBNAIL_SIZE) {
      addToast(`Thumbnail exceeds the ${MAX_THUMBNAIL_SIZE_MB} MB limit.`, 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('videoFile', videoFile);
      formData.append('thumbnail', thumbnailFile);

      await videoApi.publishVideo(formData);
      addToast('Video uploaded and published successfully!');
      resetUploadModal();
      fetchStudioData();
    } catch (err) {
      addToast(err.message || 'Failed to upload video', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleTogglePublish = async (videoId) => {
    try {
      const res = await videoApi.togglePublishStatus(videoId);
      const isPublished = res?.data?.isPublished;
      setVideos((prev) =>
        prev.map((v) => (v._id === videoId ? { ...v, isPublished } : v))
      );
      addToast(`Video is now ${isPublished ? 'Public' : 'Private'}`);
    } catch (err) {
      addToast('Failed to toggle publish status', 'error');
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video permanently?')) return;

    try {
      await videoApi.deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      addToast('Video deleted successfully');
      setStats((prev) => ({
        ...prev,
        totalVideos: Math.max(0, prev.totalVideos - 1),
      }));
    } catch (err) {
      addToast('Failed to delete video', 'error');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <AlertCircle className="w-12 h-12 text-slate-500" />
        <h2 className="text-xl font-bold text-white">Creator Studio Requires Sign In</h2>
        <p className="text-sm text-slate-400">Sign in with your account to access creator metrics and upload videos.</p>
        <Link to="/auth" className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Outfit']">
            Channel Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Welcome back, <span className="text-white font-semibold">{user.fullname || user.username}</span>
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-600/20 transition-all active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Video</span>
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#151722] p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Views</span>
            <Eye className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            {formatViews(stats.totalViews)}
          </p>
        </div>

        <div className="bg-[#151722] p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Subscribers</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            {formatViews(stats.totalSubscribers)}
          </p>
        </div>

        <div className="bg-[#151722] p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Likes</span>
            <ThumbsUp className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            {formatViews(stats.totalLikes)}
          </p>
        </div>

        <div className="bg-[#151722] p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Videos</span>
            <VideoIcon className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats.totalVideos}
          </p>
        </div>
      </div>

      {/* Video Content Manager */}
      <div className="bg-[#151722] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Channel Videos ({videos.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading videos...</div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <VideoIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-semibold">No videos published yet</p>
            <p className="text-xs text-slate-400">Upload your first video to see performance metrics here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-[#1a1c28]">
                  <th className="py-3.5 px-4 font-semibold">Video</th>
                  <th className="py-3.5 px-4 font-semibold">Visibility</th>
                  <th className="py-3.5 px-4 font-semibold">Views</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {videos.map((vid) => (
                  <tr key={vid._id} className="hover:bg-white/2 transition-colors">
                    {/* Video Column */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={vid.thumbnail}
                          alt={vid.title}
                          className="w-20 aspect-video object-cover rounded-lg bg-slate-800 shrink-0"
                        />
                        <div className="min-w-0 max-w-xs sm:max-w-md">
                          <Link
                            to={`/watch/${vid._id}`}
                            className="font-semibold text-slate-200 hover:text-red-400 truncate block transition-colors"
                          >
                            {vid.title}
                          </Link>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {vid.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Visibility */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleTogglePublish(vid._id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          vid.isPublished
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                        title="Click to toggle visibility"
                      >
                        {vid.isPublished ? (
                          <>
                            <Globe className="w-3 h-3" />
                            <span>Public</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Private</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Views */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {formatViews(vid.views)}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                      {formatTimeAgo(vid.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteVideo(vid._id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Video Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161821] border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Upload New Video</h3>
              <button
                onClick={resetUploadModal}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Building Fullstack Apps with React"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-[#1e212d] text-sm text-white px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description *
                </label>
                <textarea
                  placeholder="Describe your video..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-[#1e212d] text-sm text-white px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Video File Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Video File (.mp4, .webm, .mov) *
                  </label>
                  <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                    Max: {MAX_VIDEO_SIZE_MB} MB
                  </span>
                </div>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                  onChange={handleVideoSelect}
                  required
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-500 cursor-pointer"
                />
                {videoFile && !videoError && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Selected: {videoFile.name} ({formatFileSize(videoFile.size)})</span>
                  </p>
                )}
                {videoError && (
                  <div className="text-xs text-rose-300 flex items-start gap-2 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/60">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{videoError}</span>
                  </div>
                )}
                <p className="text-[11px] text-slate-500">
                  Cloudinary limits video uploads to {MAX_VIDEO_SIZE_MB} MB on the free tier.
                </p>
              </div>

              {/* Thumbnail Image Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Thumbnail Image (.jpg, .png, .webp) *
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                    Max: {MAX_THUMBNAIL_SIZE_MB} MB
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  onChange={handleThumbnailSelect}
                  required
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer"
                />
                {thumbnailFile && !thumbnailError && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Selected: {thumbnailFile.name} ({formatFileSize(thumbnailFile.size)})</span>
                  </p>
                )}
                {thumbnailError && (
                  <div className="text-xs text-rose-300 flex items-start gap-2 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/60">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{thumbnailError}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={resetUploadModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !!videoError || !!thumbnailError}
                  className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Publish Video</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
