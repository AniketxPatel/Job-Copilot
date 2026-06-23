'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [supabaseClient, setSupabaseClient] = useState<any>(null);

  useEffect(() => {
    if (supabaseUrl && supabaseAnonKey) {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      setSupabaseClient(client);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseClient) {
      setError('Supabase client is not initialized.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Supabase automatically parses the access_token from the URL hash on mount.
      // So the user has a valid active session. We just update their password.
      const { error: resetError } = await supabaseClient.auth.updateUser({
        password: password
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage('Password updated successfully! You can now close this tab and log in using the Chrome extension.');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-teal-600/10 via-emerald-600/5 to-transparent -z-10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-600/10 to-transparent -z-10 blur-3xl rounded-full" />

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Image src="/LOGO.png" alt="Job Copilot Logo" width={64} height={64} className="object-contain -mx-4 -my-4" />
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400 tracking-tight">
            Job Copilot
          </h1>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2 text-slate-100">
          Create New Password
        </h2>
        <p className="text-xs text-slate-400 text-center mb-6">
          Enter your new password below to update your account credentials.
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-xs p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 leading-relaxed">
              {error}
            </div>
          )}

          {message && (
            <div className="text-xs p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 leading-relaxed font-medium">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-teal-500/20 transition-all duration-200 transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Updating password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
