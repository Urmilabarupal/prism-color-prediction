import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Phone, Mail, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { PageId } from '../types.js';

interface LoginPageProps {
  onSuccess?: () => void;
  onLoginSuccess?: () => void;
  onBack?: () => void;
  onSkipToHome?: () => void;
  onNavigate?: (page: PageId) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onLoginSuccess,
  onBack,
  onSkipToHome,
  onNavigate,
}) => {
  const { login, googleLogin, register } = useAuth();

  const handleComplete = () => {
    if (typeof onSuccess === 'function') {
      onSuccess();
    } else if (typeof onLoginSuccess === 'function') {
      onLoginSuccess();
    } else if (typeof onSkipToHome === 'function') {
      onSkipToHome();
    }
  };

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [tab, setTab] = useState<'phone' | 'email'>('phone');
  const [countryCode, setCountryCode] = useState('+1');
  const [phone, setPhone] = useState('2025550143');
  const [email, setEmail] = useState('demo@prismgame.com');
  const [password, setPassword] = useState('password123');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const identifier = tab === 'phone' ? `${phone}` : email;
    if (tab === 'phone' && (!phone || phone.trim().length < 6)) {
      setError('Please enter a valid phone number');
      return;
    }
    if (tab === 'email' && (!email || !email.includes('@'))) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (isRegisterMode) {
        await register({
          phone: tab === 'phone' ? phone : undefined,
          email: tab === 'email' ? email : undefined,
          password,
          inviteCode: inviteCode || undefined,
        });
        setSuccessMsg('Account created successfully! Redirecting...');
      } else {
        await login(identifier, password, tab);
        setSuccessMsg('Login successful! Welcome back.');
      }
      setTimeout(() => {
        handleComplete();
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login('2025550143', 'password123', 'phone');
      setSuccessMsg('Demo login successful! Welcome to Prism.');
      setTimeout(handleComplete, 400);
    } catch (err: any) {
      setError(err.message || 'Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await googleLogin();
      setSuccessMsg('Google Login successful!');
      setTimeout(() => {
        handleComplete();
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-page" className="min-h-screen w-full bg-white flex flex-col justify-between">
      {/* Top Banner with soft gradient header */}
      <div className="relative bg-gradient-to-b from-[#FA3534]/15 via-red-50/40 to-white pt-6 pb-6 px-5 border-b border-red-50">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-900 rounded-full hover:bg-black/5 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="mt-4 text-center">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isRegisterMode ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isRegisterMode
              ? 'Register now to receive $25.00 USD Welcome Bonus!'
              : 'Log in to continue playing and winning in USD'}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 pt-4 pb-8 max-w-sm mx-auto w-full">
        {/* Phone / Email Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            id="login-tab-phone"
            type="button"
            onClick={() => {
              setTab('phone');
              setError(null);
            }}
            className={`flex-1 pb-2.5 text-center font-bold text-sm transition-colors relative ${
              tab === 'phone' ? 'text-[#FA3534]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Phone
            {tab === 'phone' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FA3534] rounded-t-full" />
            )}
          </button>
          <button
            id="login-tab-email"
            type="button"
            onClick={() => {
              setTab('email');
              setError(null);
            }}
            className={`flex-1 pb-2.5 text-center font-bold text-sm transition-colors relative ${
              tab === 'email' ? 'text-[#FA3534]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Email
            {tab === 'email' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FA3534] rounded-t-full" />
            )}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium animate-fadeIn">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 font-medium flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-green-600" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone or Email Input */}
          {tab === 'phone' ? (
            <div>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50/60 focus-within:border-[#FA3534] focus-within:bg-white transition-all overflow-hidden">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-transparent pl-3 pr-1 py-3 text-xs font-bold text-slate-700 border-r border-slate-200 outline-none cursor-pointer"
                >
                  <option value="+1">+1 (US / USD)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+1">+1 (CA)</option>
                  <option value="+971">+971 (AE)</option>
                  <option value="+61">+61 (AU)</option>
                </select>
                <div className="relative flex-1 flex items-center">
                  <input
                    id="login-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full pl-3 pr-3 py-3 text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-400 font-medium"
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:border-[#FA3534] focus-within:bg-white transition-all px-3 py-3">
                <Mail className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                <input
                  id="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-400 font-medium"
                  required
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:border-[#FA3534] focus-within:bg-white transition-all px-3 py-3">
              <Lock className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-400 font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Invite Code (Register mode only) */}
          {isRegisterMode && (
            <div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/60 focus-within:border-[#FA3534] focus-within:bg-white transition-all px-3 py-3">
                <Sparkles className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Invitation code (Optional)"
                  className="w-full text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>
          )}

          {/* Remember Password & Forgot Link */}
          {!isRegisterMode && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberPassword}
                  onChange={(e) => setRememberPassword(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FA3534] accent-[#FA3534] cursor-pointer"
                />
                Remember password
              </label>
              <button
                type="button"
                onClick={() => alert('Password recovery: Please contact Customer Service for instant verification.')}
                className="text-[#FA3534] hover:underline font-semibold"
              >
                Forgot?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#FF5252] to-[#FA3534] text-white font-bold rounded-xl shadow-[0_4px_16px_rgba(250,53,52,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isRegisterMode ? (
              'Create Account'
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {!isRegisterMode && (
          <button
            id="demo-login-btn"
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full mt-3 py-3 border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-70"
          >
            Continue with Demo Login
          </button>
        )}

        {/* Divider */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative px-3 bg-white text-xs text-slate-400 font-medium">or</span>
        </div>

        {/* Google Login Button matching reference */}
        <button
          id="login-google-btn"
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
          Login with Google
        </button>

        {/* Toggle between Login and Register */}
        <div className="text-center mt-6">
          {isRegisterMode ? (
            <p className="text-xs text-slate-600 font-medium">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setError(null);
                }}
                className="text-[#FA3534] font-bold hover:underline"
              >
                Log In
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-600 font-medium">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setError(null);
                }}
                className="text-[#FA3534] font-bold hover:underline"
              >
                Sign Up
              </button>
            </p>
          )}
        </div>
      </div>

      <div className="py-4 text-center text-[11px] text-slate-400 flex flex-col items-center gap-1">
        <span>Prism Official Platform · 100% Fair & Certified RNG</span>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('manager')}
            className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mt-1"
          >
            Manager Portal Access
          </button>
        )}
      </div>
    </div>
  );
};
