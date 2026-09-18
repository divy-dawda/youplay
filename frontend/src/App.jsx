import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import WatchPage from './pages/WatchPage';
import TweetsPage from './pages/TweetsPage';
import StudioPage from './pages/StudioPage';
import PlaylistsPage from './pages/PlaylistsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import HistoryAndLikedPage from './pages/HistoryAndLikedPage';
import ChannelPage from './pages/ChannelPage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="watch/:videoId" element={<WatchPage />} />
              <Route path="tweets" element={<TweetsPage />} />
              <Route path="studio" element={<StudioPage />} />
              <Route path="playlists" element={<PlaylistsPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="history" element={<HistoryAndLikedPage />} />
              <Route path="liked" element={<HistoryAndLikedPage />} />
              <Route path="channel/:username" element={<ChannelPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
