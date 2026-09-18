import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Film, MessageSquare, AlertCircle, Camera, Settings, LayoutDashboard } from 'lucide-react';
import { userApi, videoApi, tweetApi, subscriptionApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatViews } from '../utils/format';
import VideoCard from '../components/video/VideoCard';

export default function ChannelPage() {
  const { username } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('videos');

  const [videos, setVideos] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  useEffect(() => {
    async function loadChannel() {
      setLoading(true);
      setError(null);
      try {
        const res = await userApi.getUserProfile(username);
        if (res?.data) {
          const ch = res.data;
          setChannel(ch);
          setIsSubscribed(Boolean(ch.isSubscribed));
          setSubscribersCount(ch.subscribersCount || 0);

          // Load videos by this channel
          setContentLoading(true);
          const [vidsRes, tweetsRes] = await Promise.all([
            videoApi.getAllVideos({ userId: ch._id }),
            tweetApi.getUserTweets(ch._id),
          ]);
          if (vidsRes?.data?.docs) setVideos(vidsRes.data.docs);
          if (tweetsRes?.data) setTweets(tweetsRes.data);
        } else {
          setError('Channel not found');
        }
      } catch (err) {
        console.error('Failed to load channel:', err);
        setError(err.message || 'Failed to load channel');
      } finally {
        setLoading(false);
        setContentLoading(false);
      }
    }

    if (username) {
      loadChannel();
    }
  }, [username]);

  const handleToggleSubscribe = async () => {
    if (!user) {
      addToast('Please sign in to subscribe', 'info');
      return;
    }
    if (user._id === channel?._id) {
      addToast('You cannot subscribe to your own channel', 'info');
      return;
    }

    try {
      const res = await subscriptionApi.toggleSubscription(channel._id);
      const subbed = res?.data?.isSubscribed;
      setIsSubscribed(subbed);
      setSubscribersCount((prev) => prev + (subbed ? 1 : -1));
      addToast(subbed ? 'Subscribed to channel' : 'Unsubscribed');
    } catch (err) {
      addToast(err.message || 'Failed to update subscription', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-44 sm:h-64 bg-slate-800 rounded-3xl w-full" />
        <div className="flex gap-4 items-center">
          <div className="w-20 h-20 rounded-full bg-slate-800" />
          <div className="space-y-2">
            <div className="h-5 bg-slate-800 rounded w-40" />
            <div className="h-4 bg-slate-800 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-white">{error || 'Channel Not Found'}</h2>
        <Link to="/" className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold">
          Back to Home
        </Link>
      </div>
    );
  }

  const isOwner = user?._id === channel._id;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cover Image Banner */}
      <div className="relative w-full aspect-4/1 sm:aspect-5/1 min-h-36 max-h-72 rounded-2xl sm:rounded-3xl overflow-hidden bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 shadow-xl group">
        {channel.coverImage ? (
          <img
            src={channel.coverImage}
            alt="Cover banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm font-semibold">
            No Banner
          </div>
        )}

        {isOwner && (
          <Link
            to="/settings?tab=branding"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-2 border border-white/10 shadow-lg transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-slate-300" />
            <span>Edit Banner</span>
          </Link>
        )}
      </div>

      {/* Channel Header Info - Cleanly placed below banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1 pt-1">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative group/avatar shrink-0">
            <img
              src={channel.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=channel'}
              alt={channel.fullname || channel.username}
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-slate-800/90 shadow-2xl bg-slate-900"
            />
            {isOwner && (
              <Link
                to="/settings?tab=branding"
                title="Change Avatar"
                className="absolute inset-0 m-auto w-9 h-9 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity border border-white/20 shadow-xl"
              >
                <Camera className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-3xl font-bold text-white leading-tight font-['Outfit']">
              {channel.fullname || channel.username}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">@{channel.username}</p>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 pt-0.5">
              <span>{formatViews(subscribersCount)} subscribers</span>
              <span>•</span>
              <span>{videos.length} videos</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {isOwner ? (
            <>
              <Link
                to="/settings"
                className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700/60"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Customize Channel</span>
              </Link>
              <Link
                to="/studio"
                className="flex-1 sm:flex-initial px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Creator Studio</span>
              </Link>
            </>
          ) : (
            <button
              onClick={handleToggleSubscribe}
              className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                isSubscribed
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-white text-slate-900 hover:bg-slate-200 shadow-md'
              }`}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          )}
        </div>
      </div>

      {/* Channel Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-800 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('videos')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'videos'
              ? 'border-red-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Videos ({videos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tweets')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'tweets'
              ? 'border-red-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Posts ({tweets.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {contentLoading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Loading channel content...</div>
      ) : activeTab === 'videos' ? (
        videos.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            This channel hasn't uploaded any videos yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {videos.map((vid) => (
              <VideoCard key={vid._id} video={{ ...vid, owner: channel }} />
            ))}
          </div>
        )
      ) : (
        <div className="max-w-2xl mx-auto space-y-4">
          {tweets.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No community posts from this channel yet.
            </div>
          ) : (
            tweets.map((t) => (
              <div
                key={t._id}
                className="bg-[#151722] border border-slate-800 rounded-2xl p-4 space-y-2"
              >
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{t.content}</p>
                <p className="text-xs text-slate-500">
                  {new Date(t.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
