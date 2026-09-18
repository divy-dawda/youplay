import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Send, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { tweetApi, likeApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatTimeAgo, formatViews } from '../utils/format';

export default function TweetsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [tweets, setTweets] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const fetchTweets = async () => {
    setLoading(true);
    try {
      // If user logged in, fetch user's tweets; otherwise show sample or community tweets
      if (user?._id) {
        const res = await tweetApi.getUserTweets(user._id);
        if (res?.data) {
          setTweets(res.data);
        }
      } else {
        setTweets([]);
      }
    } catch (err) {
      console.error('Failed to load tweets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, [user]);

  const handlePostTweet = async (e) => {
    e.preventDefault();
    if (!user) {
      addToast('Please sign in to post a tweet', 'info');
      return;
    }
    if (!content.trim()) return;

    setPosting(true);
    try {
      await tweetApi.createTweet(content.trim());
      setContent('');
      addToast('Tweet posted to community!');
      fetchTweets();
    } catch (err) {
      addToast(err.message || 'Failed to post tweet', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (tweetId) => {
    if (!user) {
      addToast('Please sign in to like', 'info');
      return;
    }

    try {
      const res = await likeApi.toggleTweetLike(tweetId);
      const isLiked = res?.data?.isLiked;

      setTweets((prev) =>
        prev.map((t) => {
          if (t._id === tweetId) {
            return {
              ...t,
              isLiked,
              likesCount: (t.likesCount || 0) + (isLiked ? 1 : -1),
            };
          }
          return t;
        })
      );
    } catch (err) {
      addToast('Failed to toggle like', 'error');
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    if (!window.confirm('Delete this tweet?')) return;

    try {
      await tweetApi.deleteTweet(tweetId);
      setTweets((prev) => prev.filter((t) => t._id !== tweetId));
      addToast('Tweet deleted');
    } catch (err) {
      addToast('Failed to delete tweet', 'error');
    }
  };

  const handleUpdateTweet = async (tweetId) => {
    if (!editContent.trim()) return;

    try {
      await tweetApi.updateTweet(tweetId, editContent.trim());
      setTweets((prev) =>
        prev.map((t) => (t._id === tweetId ? { ...t, content: editContent.trim() } : t))
      );
      setEditingId(null);
      setEditContent('');
      addToast('Tweet updated');
    } catch (err) {
      addToast('Failed to update tweet', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <MessageSquare className="w-6 h-6 text-red-500" />
          <span>Community Posts</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Share updates, announcements, and thoughts with your followers.
        </p>
      </div>

      {/* Tweet Composer */}
      <div className="bg-[#151722] border border-slate-800 rounded-2xl p-4 shadow-xl">
        <form onSubmit={handlePostTweet} className="space-y-3">
          <div className="flex gap-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <textarea
              placeholder={user ? "What's on your mind?" : "Sign in to share a post with the community"}
              value={content}
              disabled={!user || posting}
              onChange={(e) => setContent(e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 resize-none focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-400">
              {content.length}/300 characters
            </span>
            <button
              type="submit"
              disabled={!user || !content.trim() || posting}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-red-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{posting ? 'Posting...' : 'Post'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tweets Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-[#151722] p-4 rounded-2xl border border-slate-800 animate-pulse space-y-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-800 rounded w-1/4" />
                    <div className="h-3 bg-slate-800 rounded w-1/6" />
                  </div>
                </div>
                <div className="h-12 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : tweets.length === 0 ? (
          <div className="bg-[#151722] p-8 rounded-2xl border border-slate-800 text-center space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-semibold">No community posts yet</p>
            <p className="text-xs text-slate-400">
              Post an update using the box above to kickstart your community feed.
            </p>
          </div>
        ) : (
          tweets.map((tweet) => {
            const isOwner = user?._id && tweet.owner?._id === user._id;

            return (
              <div
                key={tweet._id}
                className="bg-[#151722] border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 transition-colors hover:border-slate-700/80"
              >
                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={tweet.owner?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=creator'}
                      alt={tweet.owner?.fullname || tweet.owner?.username}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white leading-tight">
                        {tweet.owner?.fullname || tweet.owner?.username}
                      </h4>
                      <p className="text-xs text-slate-400">
                        @{tweet.owner?.username} • {formatTimeAgo(tweet.createdAt)}
                      </p>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <button
                        onClick={() => {
                          setEditingId(tweet._id);
                          setEditContent(tweet.content);
                        }}
                        className="p-1.5 hover:text-white rounded-lg hover:bg-slate-800"
                        title="Edit post"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTweet(tweet._id)}
                        className="p-1.5 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content or Edit Form */}
                {editingId === tweet._id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full bg-[#1c1f2e] text-sm text-white p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-red-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateTweet(tweet._id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {tweet.content}
                  </p>
                )}

                {/* Post Actions */}
                <div className="flex items-center gap-4 pt-1 border-t border-slate-800/60 text-xs text-slate-400">
                  <button
                    onClick={() => handleToggleLike(tweet._id)}
                    className={`flex items-center gap-1.5 hover:text-white transition-colors ${
                      tweet.isLiked ? 'text-red-500 font-semibold' : ''
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${tweet.isLiked ? 'fill-red-500' : ''}`} />
                    <span>{tweet.likesCount || 0}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
