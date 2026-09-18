import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, User, Mail, Lock, Image as ImageIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form fields
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isRegister) {
        if (!avatarFile) {
          setError('Avatar image is required for registration');
          setSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append('fullname', fullname.trim());
        formData.append('username', username.trim().toLowerCase());
        formData.append('email', email.trim().toLowerCase());
        formData.append('password', password);
        formData.append('avatar', avatarFile);
        if (coverFile) {
          formData.append('coverImage', coverFile);
        }

        await register(formData);
        addToast('Account created successfully! Please sign in.');
        setIsRegister(false);
      } else {
        await login({
          username: username.trim() || undefined,
          email: email.trim() || undefined,
          password,
        });
        addToast('Welcome back to YouPlay!');
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full bg-[#151722] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-linear-to-tr from-red-600 to-rose-500 shadow-lg shadow-red-600/20 mb-2">
            <Play className="w-6 h-6 fill-white text-white translate-x-0.5" />
          </div>
          <h2 className="text-2xl font-extrabold text-white font-['Outfit']">
            {isRegister ? 'Join YouPlay' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-400">
            {isRegister
              ? 'Create a channel, stream videos, and connect with creators.'
              : 'Sign in to access your subscriptions, library, and studio.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  required
                  className="w-full bg-[#1c1f2e] text-sm text-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-red-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={isRegister}
                className="w-full bg-[#1c1f2e] text-sm text-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-red-500"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email {isRegister ? '' : '(or use username above)'}
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={isRegister}
                className="w-full bg-[#1c1f2e] text-sm text-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-red-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#1c1f2e] text-sm text-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-red-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Registration Files: Avatar & Cover */}
          {isRegister && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Avatar Photo *
                </label>
                <div className="flex items-center gap-3">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-12 h-12 rounded-full object-cover border border-slate-600"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#1c1f2e] border border-dashed border-slate-600 flex items-center justify-center text-slate-500">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    required
                    className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Channel Banner (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-lg shadow-red-600/20 transition-all active:scale-[0.99] mt-2"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Create Channel Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div className="pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-red-400 hover:text-red-300 font-semibold transition-colors"
            >
              {isRegister ? 'Sign In' : 'Register now'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
