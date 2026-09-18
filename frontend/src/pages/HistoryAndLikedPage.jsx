import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Clock, ThumbsUp, AlertCircle, Film } from 'lucide-react';
import { userApi, likeApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/video/VideoCard';

export default function HistoryAndLikedPage() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const isLikedPage = pathname.includes('/liked');
  const title = isLikedPage ? 'Liked Videos' : 'Watch History';
  const Icon = isLikedPage ? ThumbsUp : Clock;

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        if (isLikedPage) {
          const res = await likeApi.getLikedVideos();
          if (res?.data) {
            // Liked videos response has array with { video: {...} }
            const vids = res.data.map((item) => item.video).filter(Boolean);
            setVideos(vids);
          }
        } else {
          const res = await userApi.getWatchHistory();
          if (res?.data) {
            setVideos(res.data);
          }
        }
      } catch (err) {
        console.error('Failed to load history or liked:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isLikedPage, user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <AlertCircle className="w-12 h-12 text-slate-500" />
        <h2 className="text-xl font-bold text-white">Sign In to View {title}</h2>
        <Link to="/auth" className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Icon className="w-6 h-6 text-red-500" />
          <span>{title}</span>
        </h1>
        <p className="text-sm text-slate-400">
          {isLikedPage
            ? 'Videos you have enjoyed and given a thumbs up.'
            : 'Track the videos you recently watched on YouPlay.'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="aspect-video bg-[#151722] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-[#151722] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold">No videos found</p>
          <p className="text-xs text-slate-400">
            {isLikedPage
              ? 'Like videos by clicking the thumbs-up button while watching.'
              : 'Videos you watch will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {videos.map((vid) => (
            <VideoCard key={vid._id} video={vid} />
          ))}
        </div>
      )}
    </div>
  );
}
