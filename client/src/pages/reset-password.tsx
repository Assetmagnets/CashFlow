import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!token) {
      setErrorMsg('Missing reset token. Please click the link in your email again.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsResetting(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccessMsg('Your password has been successfully reset! You will be redirected to the login page...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. The link might be expired.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-600/10 dark:bg-amber-600/5 blur-[120px]" />

      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 z-10 p-10 md:p-14">
        
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-12 h-12 rounded-xl gradient-orange-amber flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Building2 className="text-white w-6 h-6" />
          </div>
          <span className="font-extrabold tracking-wider text-2xl uppercase text-slate-900 dark:text-white">CASHFLOW</span>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Create New Password</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Please enter your new strong password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm border border-rose-100 dark:border-rose-900/30">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}
          
          {successMsg && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-sm border border-emerald-100 dark:border-emerald-900/30">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={!token || !!successMsg}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Confirm New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={!token || !!successMsg}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isResetting || !token || !!successMsg}
            className="w-full py-4 px-6 rounded-xl gradient-orange-amber text-white font-bold text-sm shadow-xl shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isResetting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Updating Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
