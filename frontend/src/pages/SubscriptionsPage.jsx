import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserMinus, AlertCircle } from 'lucide-react';
import { subscriptionApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await subscriptionApi.getSubscribedChannels(user._id);
      if (res?.data) {
        setSubscriptions(res.data);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  const handleUnsubscribe = async (channelId) => {
    try {
      await subscriptionApi.toggleSubscription(channelId);
      setSubscriptions((prev) => prev.filter((s) => s.channel?._id !== channelId));
      addToast('Unsubscribed from channel');
    } catch (err) {
      addToast('Failed to unsubscribe', 'error');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <AlertCircle className="w-12 h-12 text-slate-500" />
        <h2 className="text-xl font-bold text-white">Sign In to View Subscriptions</h2>
        <Link to="/auth" className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-red-500" />
          <span>Subscribed Channels</span>
        </h1>
        <p className="text-sm text-slate-400">Creators and channels you follow.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-[#151722] p-4 rounded-2xl border border-slate-800 animate-pulse h-20" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-[#151722] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold">You haven't subscribed to any channels yet</p>
          <p className="text-xs text-slate-400">Explore videos and subscribe to creators you enjoy!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => {
            const channel = sub.channel || {};
            return (
              <div
                key={sub._id}
                className="bg-[#151722] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 flex items-center justify-between gap-3 transition-colors"
              >
                <Link
                  to={`/channel/${channel.username || ''}`}
                  className="flex items-center gap-3 min-w-0"
                >
                  <img
                    src={channel.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=channel'}
                    alt={channel.fullname || channel.username}
                    className="w-12 h-12 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-white truncate hover:text-red-400 transition-colors">
                      {channel.fullname || channel.username}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">@{channel.username}</p>
                  </div>
                </Link>

                <button
                  onClick={() => handleUnsubscribe(channel._id)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors shrink-0"
                  title="Unsubscribe"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
