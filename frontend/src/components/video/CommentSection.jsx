import React, { useState, useEffect } from 'react';
import { ThumbsUp, Send, Trash2, Edit2, X, Check } from 'lucide-react';
import { commentApi, likeApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatTimeAgo } from '../../utils/format';

export default function CommentSection({ videoId }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const fetchComments = async () => {
    try {
      const res = await commentApi.getVideoComments(videoId);
      if (res?.data?.docs) {
        setComments(res.data.docs);
        setTotalComments(res.data.totalDocs || res.data.docs.length);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      fetchComments();
    }
  }, [videoId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      addToast('Please sign in to post a comment', 'info');
      return;
    }
    if (!newContent.trim()) return;

    setSubmitting(true);
    try {
      await commentApi.addComment(videoId, newContent.trim());
      setNewContent('');
      addToast('Comment added');
      fetchComments();
    } catch (err) {
      addToast(err.message || 'Failed to add comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      addToast('Please sign in to like comments', 'info');
      return;
    }

    try {
      const res = await likeApi.toggleCommentLike(commentId);
      const isLiked = res?.data?.isLiked;

      setComments((prev) =>
        prev.map((c) => {
          if (c._id === commentId) {
            return {
              ...c,
              isLiked,
              likesCount: (c.likesCount || 0) + (isLiked ? 1 : -1),
            };
          }
          return c;
        })
      );
    } catch (err) {
      addToast('Failed to toggle like', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await commentApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setTotalComments((prev) => Math.max(0, prev - 1));
      addToast('Comment deleted');
    } catch (err) {
      addToast('Failed to delete comment', 'error');
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      await commentApi.updateComment(commentId, editContent.trim());
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId ? { ...c, content: editContent.trim() } : c
        )
      );
      setEditingId(null);
      setEditContent('');
      addToast('Comment updated');
    } catch (err) {
      addToast('Failed to update comment', 'error');
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
        <span>Comments</span>
        <span className="text-sm font-normal text-slate-400">({totalComments})</span>
      </h3>

      {/* Add comment box */}
      <form onSubmit={handleAddComment} className="flex items-start gap-3">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="w-9 h-9 rounded-full object-cover border border-slate-800"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
        )}

        <div className="flex-1 flex flex-col gap-2">
          <input
            type="text"
            placeholder={user ? 'Add a public comment...' : 'Sign in to comment'}
            value={newContent}
            disabled={!user || submitting}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full bg-[#161821] text-sm text-slate-200 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-red-500 transition-colors"
          />
          {newContent.trim() && (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewContent('')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Comment</span>
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-3 animate-pulse">
                <div className="w-9 h-9 bg-slate-800 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-3.5 bg-slate-800 rounded" />
                  <div className="w-3/4 h-3.5 bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No comments yet. Be the first to start the conversation!</p>
        ) : (
          comments.map((comment) => {
            const isOwner = user?._id && comment.owner?._id === user._id;

            return (
              <div key={comment._id} className="flex items-start gap-3 group">
                <img
                  src={comment.owner?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=creator'}
                  alt={comment.owner?.username}
                  className="w-9 h-9 rounded-full object-cover border border-slate-800 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-200">
                      @{comment.owner?.username || 'user'}
                    </span>
                    <span className="text-slate-400">{formatTimeAgo(comment.createdAt)}</span>
                  </div>

                  {editingId === comment._id ? (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 bg-[#1a1c26] text-sm text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-red-500"
                      />
                      <button
                        onClick={() => handleUpdateComment(comment._id)}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300 mt-1 wrap-break-word">{comment.content}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <button
                      onClick={() => handleLikeComment(comment._id)}
                      className={`flex items-center gap-1.5 hover:text-white transition-colors ${
                        comment.isLiked ? 'text-red-500 font-semibold' : ''
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-red-500' : ''}`} />
                      <span>{comment.likesCount || 0}</span>
                    </button>

                    {isOwner && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingId(comment._id);
                            setEditContent(comment.content);
                          }}
                          className="hover:text-white"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
