import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderPlus, Trash2, Play, Plus, X, AlertCircle } from 'lucide-react';
import { playlistApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatTimeAgo } from '../utils/format';

export default function PlaylistsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create playlist modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Selected playlist view
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPlaylists = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await playlistApi.getUserPlaylists(user._id);
      if (res?.data) {
        setPlaylists(res.data);
      }
    } catch (err) {
      console.error('Failed to load playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [user]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    setCreating(true);
    try {
      await playlistApi.createPlaylist(name.trim(), description.trim());
      addToast('Playlist created!');
      setShowCreateModal(false);
      setName('');
      setDescription('');
      fetchPlaylists();
    } catch (err) {
      addToast(err.message || 'Failed to create playlist', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenPlaylist = async (playlistId) => {
    setDetailLoading(true);
    try {
      const res = await playlistApi.getPlaylistById(playlistId);
      if (res?.data) {
        setSelectedPlaylist(res.data);
      }
    } catch (err) {
      addToast('Failed to load playlist details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Delete this playlist?')) return;

    try {
      await playlistApi.deletePlaylist(playlistId);
      setPlaylists((prev) => prev.filter((p) => p._id !== playlistId));
      if (selectedPlaylist?._id === playlistId) {
        setSelectedPlaylist(null);
      }
      addToast('Playlist deleted');
    } catch (err) {
      addToast('Failed to delete playlist', 'error');
    }
  };

  const handleRemoveVideo = async (playlistId, videoId) => {
    try {
      await playlistApi.removeVideoFromPlaylist(videoId, playlistId);
      setSelectedPlaylist((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => v._id !== videoId),
      }));
      addToast('Video removed from playlist');
    } catch (err) {
      addToast('Failed to remove video', 'error');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <AlertCircle className="w-12 h-12 text-slate-500" />
        <h2 className="text-xl font-bold text-white">Sign In to View Playlists</h2>
        <Link to="/auth" className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderPlus className="w-6 h-6 text-red-500" />
            <span>Playlists</span>
          </h1>
          <p className="text-sm text-slate-400">Curate collections of your favorite videos.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-[#151722] p-6 rounded-2xl border border-slate-800 animate-pulse h-40" />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="bg-[#151722] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <FolderPlus className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold">No playlists created yet</p>
          <p className="text-xs text-slate-400">Create one to organize and save videos for later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {playlists.map((pl) => (
            <div
              key={pl._id}
              onClick={() => handleOpenPlaylist(pl._id)}
              className="bg-[#151722] hover:bg-[#1c1f2e] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 cursor-pointer transition-all space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base group-hover:text-red-400 transition-colors truncate">
                  {pl.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">{pl.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                <span>{pl.totalVideos || pl.videos?.length || 0} videos</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePlaylist(pl._id);
                  }}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Playlist Drawer / Detail */}
      {selectedPlaylist && (
        <div className="bg-[#151722] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white">{selectedPlaylist.name}</h2>
              <p className="text-xs text-slate-400">{selectedPlaylist.description}</p>
            </div>
            <button
              onClick={() => setSelectedPlaylist(null)}
              className="p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedPlaylist.videos?.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              No videos in this playlist yet. Add videos from any video watch page!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedPlaylist.videos.map((vid) => (
                <div
                  key={vid._id}
                  className="relative group bg-[#1c1f2e] rounded-xl overflow-hidden border border-slate-800"
                >
                  <Link to={`/watch/${vid._id}`} className="block aspect-video bg-black">
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="p-3 flex items-start justify-between gap-2">
                    <Link
                      to={`/watch/${vid._id}`}
                      className="font-semibold text-xs text-white line-clamp-2 hover:text-red-400"
                    >
                      {vid.title}
                    </Link>
                    <button
                      onClick={() => handleRemoveVideo(selectedPlaylist._id, vid._id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Remove from playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161821] border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-white">Create Playlist</h3>
            <form onSubmit={handleCreatePlaylist} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Playlist Name</label>
                <input
                  type="text"
                  placeholder="e.g. Favorite Music"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#1e212d] text-sm text-white px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  placeholder="Description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-[#1e212d] text-sm text-white px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-500"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
