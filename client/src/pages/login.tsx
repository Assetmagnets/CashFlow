import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';
import { Building2, KeyRound, Mail, Loader2, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { login, user, loading, token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to respective dashboard
    if (token && user) {
      navigate(user.role === 'OWNER' ? '/owner/dashboard' : '/supervisor/dashboard', { replace: true });
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      const loggedUser = await login(email, password);
      navigate(loggedUser.role === 'OWNER' ? '/owner/dashboard' : '/supervisor/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-600/10 dark:bg-amber-600/5 blur-[120px]" />

      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row min-h-[600px] z-10">
        {/* Banner Column - Construction themed design */}
        <div className="md:w-1/2 gradient-orange-amber p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:24px_24px]" />
          
          <div className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Building2 className="text-white w-6 h-6" />
            </div>
            <span className="font-bold tracking-wider text-xl uppercase">CASHFLOW</span>
          </div>

          <div className="my-auto space-y-6 z-10 pr-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Site Cash Flow <br />
              <span className="text-amber-100">Management System</span>
            </h1>
            <p className="text-white/80 leading-relaxed text-sm md:text-base">
              Track site-wise cash dispatches, confirm receipt balances instantly, and audit construction expense categories on a secure, ledger-based platform.
            </p>
          </div>

          <div className="text-xs text-white/60 z-10">
            &copy; 2026 CashFlow Systems. All rights reserved.
          </div>
        </div>

        {/* Form Column */}
        <div className="md:w-1/2 p-12 md:p-16 flex flex-col justify-center bg-white dark:bg-slate-900">
          <div className="space-y-2 mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Welcome back</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Sign in with your operational credentials.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm border border-rose-100 dark:border-rose-900/30">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cashflow.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Security Password</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl gradient-orange-amber text-white font-bold text-sm shadow-xl shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Securing Connection...
                </>
              ) : (
                'Sign In securely'
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
};

export default Login;
