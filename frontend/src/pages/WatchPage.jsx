import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ThumbsUp,
  Share2,
  FolderPlus,
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { videoApi, likeApi, subscriptionApi, playlistApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatViews, formatTimeAgo } from '../utils/format';
import VideoPlayer from '../components/video/VideoPlayer';
import CommentSection from '../components/video/CommentSection';
import VideoCard from '../components/video/VideoCard';

export default function WatchPage() {
  const { videoId } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Likes & Subscription state
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  // Playlist modal state
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);

  // Recommended videos
  const [recommended, setRecommended] = useState([]);

  // Guard to ensure we only load each videoId once per lifecycle/navigation
  const lastFetchedVideoIdRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;
    if (lastFetchedVideoIdRef.current === videoId) return;
    lastFetchedVideoIdRef.current = videoId;

    async function loadVideo() {
      setLoading(true);
      setError(null);
      try {
        const res = await videoApi.getVideoById(videoId);
        if (res?.data) {
          const v = res.data;
          setVideo(v);
          setIsLiked(Boolean(v.isLiked));
          setLikesCount(v.likesCount || 0);
          setIsSubscribed(Boolean(v.owner?.isSubscribed));
          setSubscribersCount(v.owner?.subscribersCount || 0);
        } else {
          setError('Video not found');
        }
      } catch (err) {
        console.error('Error loading video:', err);
        setError(err.message || 'Failed to load video');
        lastFetchedVideoIdRef.current = null;
      } finally {
        setLoading(false);
      }
    }

    async function loadRecommended() {
      try {
        const res = await videoApi.getAllVideos({ limit: 8 });
        if (res?.data?.docs) {
          setRecommended(res.data.docs.filter((v) => v._id !== videoId));
        }
      } catch (err) {
        console.error('Failed to load recommended:', err);
      }
    }

    loadVideo();
    loadRecommended();
    window.scrollTo(0, 0);
  }, [videoId]);

  const handleToggleLike = async () => {
    if (!user) {
      addToast('Please sign in to like this video', 'info');
      return;
    }

    try {
      const res = await likeApi.toggleVideoLike(videoId);
      const liked = res?.data?.isLiked;
      setIsLiked(liked);
      setLikesCount((prev) => prev + (liked ? 1 : -1));
      addToast(liked ? 'Added to liked videos' : 'Removed from liked videos');
    } catch (err) {
      addToast('Failed to toggle like', 'error');
    }
  };

  const handleToggleSubscribe = async () => {
    if (!user) {
      addToast('Please sign in to subscribe', 'info');
      return;
    }
    if (user._id === video?.owner?._id) {
      addToast('You cannot subscribe to your own channel', 'info');
      return;
    }

    try {
      const res = await subscriptionApi.toggleSubscription(video.owner._id);
      const subbed = res?.data?.isSubscribed;
      setIsSubscribed(subbed);
      setSubscribersCount((prev) => prev + (subbed ? 1 : -1));
      addToast(subbed ? 'Subscribed to channel' : 'Unsubscribed from channel');
    } catch (err) {
      addToast(err.message || 'Failed to update subscription', 'error');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('Video link copied to clipboard!');
  };

  const openPlaylistModal = async () => {
    if (!user) {
      addToast('Please sign in to save to playlist', 'info');
      return;
    }
    setShowPlaylistModal(true);
    setPlaylistLoading(true);
    try {
      const res = await playlistApi.getUserPlaylists(user._id);
      if (res?.data) {
        setUserPlaylists(res.data);
      }
    } catch (err) {
      addToast('Failed to fetch playlists', 'error');
    } finally {
      setPlaylistLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    try {
      await playlistApi.addVideoToPlaylist(videoId, playlistId);
      addToast('Saved to playlist!');
      setShowPlaylistModal(false);
    } catch (err) {
      addToast(err.message || 'Failed to add video to playlist', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 animate-pulse">
        <div className="aspect-video w-full rounded-2xl bg-slate-800" />
        <div className="h-6 bg-slate-800 rounded w-2/3" />
        <div className="h-10 bg-slate-800 rounded w-1/3" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-white">{error || 'Video unavailable'}</h2>
        <Link to="/" className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* Left / Main Column: Video Player & Details */}
      <div className="lg:col-span-2 xl:col-span-3 space-y-4">
        {/* Video Player */}
        <VideoPlayer src={video.videoFile} poster={video.thumbnail} />

        {/* Video Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
          {video.title}
        </h1>

        {/* Video Details & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
          {/* Channel Info & Subscribe */}
          <div className="flex items-center gap-3">
            <Link to={`/channel/${video.owner?.username || ''}`}>
              <img
                src={video.owner?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=creator'}
                alt={video.owner?.fullname || video.owner?.username}
                className="w-11 h-11 rounded-full object-cover border border-slate-700"
              />
            </Link>
            <div>
              <Link
                to={`/channel/${video.owner?.username || ''}`}
                className="font-bold text-sm sm:text-base text-white hover:text-red-400 transition-colors block leading-tight"
              >
                {video.owner?.fullname || video.owner?.username || 'Creator'}
              </Link>
              <span className="text-xs text-slate-400">
                {formatViews(subscribersCount)} subscribers
              </span>
            </div>

            {user?._id !== video.owner?._id && (
              <button
                onClick={handleToggleSubscribe}
                className={`ml-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  isSubscribed
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white text-slate-900 hover:bg-slate-200'
                }`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleToggleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                isLiked
                  ? 'bg-red-600 text-white'
                  : 'bg-[#181a24] text-slate-200 hover:bg-[#222533] border border-slate-800'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
              <span>{formatViews(likesCount)}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#181a24] text-slate-200 hover:bg-[#222533] border border-slate-800 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>

            <button
              onClick={openPlaylistModal}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#181a24] text-slate-200 hover:bg-[#222533] border border-slate-800 transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Description Box */}
        <div className="bg-[#151722] rounded-2xl p-4 border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span>{formatViews(video.views)} views</span>
            <span>•</span>
            <span>{formatTimeAgo(video.createdAt)}</span>
          </div>
          <p
            className={`text-sm text-slate-300 whitespace-pre-line ${
              !isDescExpanded ? 'line-clamp-2' : ''
            }`}
          >
            {video.description || 'No description provided.'}
          </p>
          <button
            onClick={() => setIsDescExpanded(!isDescExpanded)}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 pt-1"
          >
            <span>{isDescExpanded ? 'Show less' : 'Show more'}</span>
            {isDescExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Comments Section */}
        <CommentSection videoId={videoId} />
      </div>

      {/* Right Column: Suggested Videos */}
      <div className="space-y-4">
        <h3 className="font-bold text-base text-slate-200">Recommended</h3>
        <div className="flex flex-col gap-4">
          {recommended.map((item) => (
            <VideoCard key={item._id} video={item} />
          ))}
        </div>
      </div>

      {/* Playlist Save Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161821] border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-white">Save video to playlist</h3>

            {playlistLoading ? (
              <p className="text-sm text-slate-400">Loading playlists...</p>
            ) : userPlaylists.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-400">You haven't created any playlists yet.</p>
                <Link
                  to="/playlists"
                  className="block text-center px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold"
                >
                  Create a Playlist
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {userPlaylists.map((pl) => (
                  <button
                    key={pl._id}
                    onClick={() => handleAddToPlaylist(pl._id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#1d202c] hover:bg-slate-700/60 text-left transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-sm text-white">{pl.name}</p>
                      <p className="text-xs text-slate-400">{pl.videos?.length || 0} videos</p>
                    </div>
                    <FolderPlus className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
