import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      if (isForgotPassword) {
        // Redirect URL points to our Next.js backend reset-password page
        const redirectUrl = 'http://localhost:3000/reset-password';
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });
        if (error) {
          setMessage(error.message);
        } else {
          setMessage('Password reset link sent to your email!');
        }
      } else {
        let error;
        if (isSignUp) {
          const res = await supabase.auth.signUp({ email, password });
          error = res.error;
          if (!error) setMessage('Account created! You can now log in.');
        } else {
          const res = await supabase.auth.signInWithPassword({ email, password });
          error = res.error;
        }

        if (error) {
          setMessage(error.message);
        }
      }
    } catch (err: any) {
      setMessage(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-0 py-8">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-100">
          {isForgotPassword 
            ? 'Reset Password' 
            : isSignUp 
              ? 'Create Account' 
              : 'Welcome Back'}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="you@example.com"
            />
          </div>

          {!isForgotPassword && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-slate-400">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setMessage('');
                    }}
                    className="text-[10px] text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                placeholder="••••••••"
              />
            </div>
          )}
          
          {message && (
            <div className="text-xs p-2 rounded bg-slate-800/50 text-teal-300 text-center leading-relaxed">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-medium bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-lg shadow-teal-500/20 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading 
              ? 'Processing...' 
              : isForgotPassword 
                ? 'Send Reset Link' 
                : isSignUp 
                  ? 'Sign Up' 
                  : 'Log In'}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          {isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setMessage('');
              }}
              className="text-xs text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
            >
              Back to Login
            </button>
          ) : (
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage('');
              }}
              className="text-xs text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
