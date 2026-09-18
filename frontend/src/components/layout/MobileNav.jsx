import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Users, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MobileNav() {
  const { user } = useAuth();

  const navItemClass = ({ isActive }) =>
    `flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors ${
      isActive ? 'text-red-500 font-semibold' : 'text-slate-400 hover:text-white'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0d12]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 flex items-center justify-around">
      <NavLink to="/" className={navItemClass}>
        <Home className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </NavLink>
      <NavLink to="/tweets" className={navItemClass}>
        <MessageSquare className="w-5 h-5 mb-0.5" />
        <span>Tweets</span>
      </NavLink>
      <NavLink to="/subscriptions" className={navItemClass}>
        <Users className="w-5 h-5 mb-0.5" />
        <span>Subs</span>
      </NavLink>
      <NavLink to="/studio" className={navItemClass}>
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Studio</span>
      </NavLink>
      <NavLink to={user ? `/channel/${user.username}` : '/auth'} className={navItemClass}>
        <User className="w-5 h-5 mb-0.5" />
        <span>{user ? 'You' : 'Login'}</span>
      </NavLink>
    </nav>
  );
}
