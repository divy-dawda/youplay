import React from 'react';
import { Link } from 'react-router-dom';
import { formatViews, formatDuration, formatTimeAgo } from '../../utils/format';

export default function VideoCard({ video }) {
  if (!video) return null;

  const {
    _id,
    title,
    thumbnail,
    duration,
    views = 0,
    createdAt,
    owner = {},
  } = video;

  return (
    <div className="group flex flex-col gap-2.5 transition-all">
      {/* Thumbnail Container */}
      <Link
        to={`/watch/${_id}`}
        className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 group-hover:border-slate-700 transition-all"
      >
        <img
          src={thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=640&q=80'}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
        />
        {duration > 0 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-xs font-semibold bg-black/85 text-white rounded-md backdrop-blur-sm">
            {formatDuration(duration)}
          </span>
        )}
      </Link>

      {/* Video Details */}
      <div className="flex gap-3 items-start px-0.5">
        <Link
          to={`/channel/${owner?.username || ''}`}
          className="shrink-0 mt-0.5"
        >
          {owner?.avatar ? (
            <img
              src={owner.avatar}
              alt={owner.fullname || owner.username}
              className="w-9 h-9 rounded-full object-cover border border-slate-800 hover:border-slate-600 transition-colors"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-white">
              {owner?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link to={`/watch/${_id}`}>
            <h3
              className="font-semibold text-sm sm:text-base text-slate-100 group-hover:text-red-400 transition-colors line-clamp-2 leading-snug"
              title={title}
            >
              {title}
            </h3>
          </Link>

          <Link
            to={`/channel/${owner?.username || ''}`}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors block mt-1 truncate"
          >
            {owner?.fullname || owner?.username || 'Creator'}
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
            <span>{formatViews(views)} views</span>
            <span>•</span>
            <span>{formatTimeAgo(createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
