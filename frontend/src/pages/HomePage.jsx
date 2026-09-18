import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { videoApi } from '../api/client';
import VideoCard from '../components/video/VideoCard';
import { Film, Compass, Flame, Radio, Gamepad2, Code, Music2, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Trending',
  'Gaming',
  'Coding',
  'Music',
  'Podcasts',
  'Tech',
  'Education',
  'News',
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        limit: 24,
      };
      if (queryParam) {
        params.query = queryParam;
      } else if (selectedCategory !== 'All' && selectedCategory !== 'Trending') {
        params.query = selectedCategory;
      }
      
      const res = await videoApi.getAllVideos(params);
      if (res?.data?.docs) {
        setVideos(res.data.docs);
      } else {
        setVideos([]);
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
      setError(err.message || 'Unable to load videos right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [queryParam, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Category Pills Header */}
      {!queryParam && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-[#181a24] text-slate-300 hover:bg-[#232635] hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Query Search Active Banner */}
      {queryParam && (
        <div className="flex items-center justify-between bg-[#161821] p-3.5 rounded-2xl border border-slate-800">
          <p className="text-sm text-slate-300">
            Showing search results for: <span className="font-semibold text-white">"{queryParam}"</span>
          </p>
          <button
            onClick={() => setSearchParams({})}
            className="text-xs text-red-400 hover:text-red-300 font-semibold"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Videos Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="flex flex-col gap-2.5 animate-pulse">
              <div className="aspect-video w-full rounded-2xl bg-slate-800/80" />
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-800 rounded w-5/6" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">No videos found</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            {queryParam
              ? 'Try different keywords or explore the home categories.'
              : 'Be the first creator to upload a video to YouPlay!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
