import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';
import { Building2, KeyRound, Mail, Loader2, AlertCircle, Hash, CheckCircle2, Eye, EyeOff } from 'lucide-react';

type AuthMode = 'LOGIN' | 'FORGOT_PASSWORD_EMAIL' | 'FORGOT_PASSWORD_OTP';

const Login: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP States
  const [otpSessionToken, setOtpSessionToken] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { login, logout, user, loading, token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to respective dashboard
    if (token && user) {
      const getDashboardPath = (role: string) => {
        if (role === 'OWNER') return '/owner/dashboard';
        if (role === 'SUPERVISOR') return '/supervisor/dashboard';
        if (role === 'MIDDLEMAN') return '/middleman/dashboard';
        return '/login';
      };
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [token, user, navigate]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      const loggedUser = await login(email, password);
      const getDashboardPath = (role: string) => {
        if (role === 'OWNER') return '/owner/dashboard';
        if (role === 'SUPERVISOR') return '/supervisor/dashboard';
        if (role === 'MIDDLEMAN') return '/middleman/dashboard';
        return '/login';
      };
      navigate(getDashboardPath(loggedUser.role), { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to request OTP');
      
      setSuccessMsg(data.data?.message || data.message || 'OTP sent to your email.');
      if (data.data?.otpSessionToken) {
        setOtpSessionToken(data.data.otpSessionToken);
        setAuthMode('FORGOT_PASSWORD_OTP');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request OTP.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!otp || !newPassword || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpSessionToken, otp, newPassword }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');
      
      // On success, force logout to clear any lingering sessions
      logout();
      setSuccessMsg('Password reset successfully! Please log in with your new password.');
      setAuthMode('LOGIN');
      setPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpSessionToken('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. OTP might be invalid or expired.');
    } finally {
      setIsProcessing(false);
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
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {authMode === 'LOGIN' && 'Welcome back'}
              {authMode === 'FORGOT_PASSWORD_EMAIL' && 'Reset Password'}
              {authMode === 'FORGOT_PASSWORD_OTP' && 'Verify OTP'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {authMode === 'LOGIN' && 'Sign in with your operational credentials.'}
              {authMode === 'FORGOT_PASSWORD_EMAIL' && 'Enter your email to receive a secure OTP.'}
              {authMode === 'FORGOT_PASSWORD_OTP' && 'Enter the 6-digit code sent to your email.'}
            </p>
          </div>

          <form 
            onSubmit={
              authMode === 'LOGIN' ? handleLoginSubmit : 
              authMode === 'FORGOT_PASSWORD_EMAIL' ? handleRequestOtp : 
              handleResetPassword
            } 
            className="space-y-6"
          >
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

            {(authMode === 'LOGIN' || authMode === 'FORGOT_PASSWORD_EMAIL') && (
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
            )}

            {authMode === 'LOGIN' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Security Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('FORGOT_PASSWORD_EMAIL'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-xs font-bold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm font-medium"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {authMode === 'FORGOT_PASSWORD_OTP' && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">6-Digit OTP</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      placeholder="123456"
                      required
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm font-medium tracking-[0.5em] text-center"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm font-medium"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm font-medium"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || isProcessing}
              className="w-full py-4 px-6 rounded-xl gradient-orange-amber text-white font-bold text-sm shadow-xl shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading || isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {authMode === 'LOGIN' && 'Securing Connection...'}
                  {authMode === 'FORGOT_PASSWORD_EMAIL' && 'Sending OTP...'}
                  {authMode === 'FORGOT_PASSWORD_OTP' && 'Verifying & Resetting...'}
                </>
              ) : (
                <>
                  {authMode === 'LOGIN' && 'Sign In securely'}
                  {authMode === 'FORGOT_PASSWORD_EMAIL' && 'Send OTP'}
                  {authMode === 'FORGOT_PASSWORD_OTP' && 'Reset Password'}
                </>
              )}
            </button>
            
            {authMode !== 'LOGIN' && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => { setAuthMode('LOGIN'); setErrorMsg(''); setSuccessMsg(''); setOtpSessionToken(''); }}
                  className="text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;
