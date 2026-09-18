import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Search,
  X,
  Upload,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Clock,
  ThumbsUp,
  FolderPlus,
  Settings,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Navbar({ onToggleSidebar, onSearch }) {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Logged out successfully');
      navigate('/');
      setIsDropdownOpen(false);
    } catch (err) {
      addToast('Failed to logout', 'error');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav px-3 sm:px-6 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Hamburger & Logo */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors hidden md:flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform">
            <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-tight text-white font-['Outfit']">
            You<span className="text-red-500">Play</span>
          </span>
        </Link>
      </div>

      {/* Middle: Desktop Search Bar */}
      <div className="hidden sm:flex flex-1 max-w-xl mx-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
          <input
            type="text"
            placeholder="Search videos, creators, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161821] text-sm text-slate-200 placeholder-slate-400 pl-4 pr-20 py-2 rounded-full border border-slate-700/60 focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-12 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 top-1 bottom-1 px-3 bg-slate-800/80 hover:bg-red-600 text-slate-300 hover:text-white rounded-full transition-colors flex items-center justify-center"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Right: Actions & User Profile */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Mobile search trigger */}
        <button
          onClick={() => setShowMobileSearch(true)}
          aria-label="Open search"
          className="sm:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        {user ? (
          <>
            <Link
              to="/studio"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Studio</span>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center focus:outline-none ring-2 ring-transparent focus:ring-red-500 rounded-full"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullname || user.username}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-white">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl p-2 shadow-2xl z-50 border border-slate-700/60 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2.5 border-b border-slate-800">
                    <p className="font-semibold text-sm text-white truncate">{user.fullname || user.username}</p>
                    <p className="text-xs text-slate-400 truncate">@{user.username}</p>
                  </div>

                  <div className="py-1 text-sm text-slate-300">
                    <Link
                      to={`/channel/${user.username}`}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Your Channel</span>
                    </Link>
                    <Link
                      to="/studio"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      <span>Creator Studio</span>
                    </Link>
                    <Link
                      to="/history"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Watch History</span>
                    </Link>
                    <Link
                      to="/liked"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4 text-slate-400" />
                      <span>Liked Videos</span>
                    </Link>
                    <Link
                      to="/playlists"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <FolderPlus className="w-4 h-4 text-slate-400" />
                      <span>Playlists</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            to="/auth"
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-900 hover:bg-slate-200 transition-all active:scale-95"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="sm:hidden fixed inset-0 z-50 bg-[#0c0d12]/95 backdrop-blur-md p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
              <input
                type="text"
                autoFocus
                placeholder="Search YouPlay..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161821] text-sm text-slate-200 pl-4 pr-10 py-2.5 rounded-full border border-slate-700 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-2 p-1.5 text-slate-400 hover:text-white"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
            <button
              onClick={() => setShowMobileSearch(false)}
              className="p-2 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
