import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  MessageSquare,
  Users,
  Clock,
  ThumbsUp,
  FolderPlus,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen }) {
  const { user } = useAuth();

  const mainLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/tweets', label: 'Community', icon: MessageSquare },
    { to: '/subscriptions', label: 'Subscriptions', icon: Users },
  ];

  const libraryLinks = [
    { to: '/history', label: 'History', icon: Clock },
    { to: '/liked', label: 'Liked Videos', icon: ThumbsUp },
    { to: '/playlists', label: 'Playlists', icon: FolderPlus },
  ];

  const creatorLinks = [
    { to: '/studio', label: 'Creator Studio', icon: LayoutDashboard },
  ];

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-red-500/10 text-red-500 font-semibold'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    } ${!isOpen ? 'justify-center px-2' : ''}`;

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] glass-nav border-r border-slate-800/80 transition-all duration-200 overflow-y-auto px-2 py-4 ${
        isOpen ? 'w-56' : 'w-18'
      }`}
    >
      {/* Main Section */}
      <div className="space-y-1">
        {mainLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={navItemClass}
              title={!isOpen ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {isOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      <hr className="my-4 border-slate-800/80" />

      {/* Library Section */}
      <div className="space-y-1">
        {isOpen && (
          <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Library
          </p>
        )}
        {libraryLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={navItemClass}
              title={!isOpen ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {isOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      <hr className="my-4 border-slate-800/80" />

      {/* Creator Studio */}
      <div className="space-y-1">
        {isOpen && (
          <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Creator
          </p>
        )}
        {creatorLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={navItemClass}
              title={!isOpen ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 text-red-400" />
              {isOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
