import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  User,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users
} from 'lucide-react';
import { securityService } from '../../services/securityService';
import { SecurityUser } from '../../types/security';
import { useSecurity } from '../../context/SecurityContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeModeDropdown } from '../common/ThemeModeDropdown';
import {
  loginMediaService,
  LoginPageMediaSettings
} from '../../services/loginMediaService';
import { centralEmailService } from '../../services/centralEmailService';

interface LoginPageProps {
  onSuccess?: (user?: SecurityUser) => void;
  onLoginSuccess?: (user: SecurityUser) => void;
  onCancel?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onLoginSuccess }) => {
  const { switchUser } = useSecurity();
  const { isDarkMode } = useTheme();
  const [identifier, setIdentifier] = useState('superadmin');
  const [password, setPassword] = useState('Innovista#2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [quickLoginOpen, setQuickLoginOpen] = useState(false);
  const quickDropdownRef = useRef<HTMLDivElement>(null);

  // All dummy accounts in the system
  const dummyAccounts = useMemo(() => {
    return securityService.getUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickDropdownRef.current && !quickDropdownRef.current.contains(e.target as Node)) {
        setQuickLoginOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Media & Branding Settings from Settings Portal
  const [mediaSettings, setMediaSettings] = useState<LoginPageMediaSettings>(() =>
    loginMediaService.getSettings()
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const companyFallback = useMemo(() => {
    try {
      const raw = localStorage.getItem('companySettings');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          logo: parsed.logo as string | undefined,
          logoDark: parsed.logoDark as string | undefined,
          name: parsed.name as string | undefined
        };
      }
    } catch {}
    return { logo: undefined, logoDark: undefined, name: undefined };
  }, [mediaSettings]);

  useEffect(() => {
    return loginMediaService.subscribe(() => {
      setMediaSettings(loginMediaService.getSettings());
    });
  }, []);

  const slides = mediaSettings.slides || [];

  useEffect(() => {
    if (currentSlideIndex >= slides.length && slides.length > 0) {
      setCurrentSlideIndex(0);
    }
  }, [slides.length, currentSlideIndex]);

  useEffect(() => {
    if (mediaSettings.displayMode !== 'slideshow' || slides.length <= 1) return;
    const intervalMs = Math.max(2, mediaSettings.slideIntervalSeconds || 4) * 1000;
    const timer = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [mediaSettings.displayMode, mediaSettings.slideIntervalSeconds, slides.length]);

  const completeLogin = (user: SecurityUser) => {
    switchUser(user.id);
    if (onSuccess) onSuccess(user);
    if (onLoginSuccess) onLoginSuccess(user);
  };

  // Flows: 'LOGIN' | 'MFA' | 'FORGOT' | 'REQUEST_ACCOUNT'
  const [step, setStep] = useState<'LOGIN' | 'MFA' | 'FORGOT' | 'REQUEST_ACCOUNT'>('LOGIN');
  const [pendingUser, setPendingUser] = useState<SecurityUser | null>(null);
  const [mfaCode, setMfaCode] = useState('482910');
  const [error, setError] = useState<string | null>(null);
  const [recoverySent, setRecoverySent] = useState(false);
  const [accountRequestSent, setAccountRequestSent] = useState(false);

  // Self-registration request form
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqOrg, setReqOrg] = useState('');
  const [reqUserType, setReqUserType] = useState('PROJECT_ENGINEER');

  const handleQuickDummyLogin = (account: SecurityUser) => {
    setError(null);
    setIdentifier(account.username);
    setPassword('Innovista#2026');
    setQuickLoginOpen(false);

    // If account was locked in seed data, auto-unlock for quick dummy testing
    if (account.accountStatus !== 'Active') {
      securityService.updateUser(
        account.id,
        { accountStatus: 'Active', failedLoginAttempts: 0, lockedUntil: null },
        'superadmin'
      );
    }

    securityService.setCurrentUser(account.id);
    completeLogin({ ...account, accountStatus: 'Active' });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = securityService.authenticate(identifier, password);
    if (!res.success) {
      setError(res.error || 'Invalid username or password.');
      return;
    }

    if (res.requiresMfa && res.user) {
      setPendingUser(res.user);
      void centralEmailService.generateAndSendOtp(
        res.user.email,
        'LOGIN_2FA',
        res.user.fullName
      );
      setStep('MFA');
      return;
    }

    if (res.user) {
      completeLogin(res.user);
    }
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    setError(null);

    const otpVerify = centralEmailService.verifyOtp(
      pendingUser.email,
      'LOGIN_2FA',
      mfaCode
    );
    if (otpVerify.valid) {
      securityService.setCurrentUser(pendingUser.id);
      completeLogin(pendingUser);
      return;
    }

    const res = securityService.verifyMfa(pendingUser.id, mfaCode);
    if (!res.success) {
      setError(res.error || otpVerify.message || 'Invalid code.');
      return;
    }

    if (res.user) {
      completeLogin(res.user);
    }
  };

  const handleAccountOnboardingRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim() || !reqEmail.trim()) return;
    securityService.submitAccessRequest(
      {
        requesterId: 'usr-onboarding-pending',
        requesterName: reqName.trim(),
        requesterRole: reqUserType,
        requesterDepartment: 'OPERATIONS',
        requestType: 'Role Change',
        requestedItem: `New Account (${reqUserType}) — ${reqOrg || 'Company'}`,
        currentLevel: 'Unprovisioned',
        requestedLevel: reqUserType,
        justification: `Access request from ${reqEmail.trim()}`,
        duration: 'Permanent',
        riskLevel: 'Medium'
      },
      reqEmail.trim()
    );
    setAccountRequestSent(true);
  };

  const lightLogo = mediaSettings.companyLogoUrl || companyFallback.logo;
  const darkLogo = mediaSettings.companyLogoDarkUrl || companyFallback.logoDark;
  const displayLogo = isDarkMode ? darkLogo || lightLogo : lightLogo || darkLogo;
  const displaySystemName =
    mediaSettings.systemName?.trim() ||
    companyFallback.name?.trim() ||
    'Innovista Precision Suite';

  const showVideo =
    mediaSettings.displayMode === 'video' && Boolean(mediaSettings.video?.url);

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row relative overflow-hidden">
      {/* Left Column: Image-Only Slideshow OR Single Video (No text) */}
      <div className="lg:w-7/12 min-h-[320px] lg:min-h-screen bg-slate-100 border-b lg:border-b-0 lg:border-r border-slate-200 relative overflow-hidden">
        {showVideo && mediaSettings.video ? (
          <video
            key={mediaSettings.video.url}
            src={mediaSettings.video.url}
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            onContextMenu={e => e.preventDefault()}
            onPause={e => {
              e.currentTarget.play().catch(() => {});
            }}
            className="w-full h-full object-cover absolute inset-0 pointer-events-none select-none"
          />
        ) : slides.length > 0 ? (
          <>
            {slides.map((slide, index) => (
              <img
                key={slide.id}
                src={slide.url}
                alt=""
                className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-700 ${
                  index === currentSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              />
            ))}

            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentSlideIndex(prev => (prev - 1 + slides.length) % slides.length)
                  }
                  aria-label="Previous slide"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex(prev => (prev + 1) % slides.length)}
                  aria-label="Next slide"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                  {slides.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCurrentSlideIndex(idx)}
                      aria-label={`Slide ${idx + 1}`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === currentSlideIndex ? 'w-6 bg-white' : 'w-2 bg-white/55'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-slate-100" />
        )}
      </div>

      {/* Right Column: Pure White Background + Company Logo & System Name + Complete White Login Box */}
      <div className="lg:w-5/12 p-6 lg:p-12 bg-white flex flex-col items-center justify-center relative z-10 min-h-screen">
        {/* Top-Right Theme Mode Dropdown (Light, Black, Night Blue, Cream, Charcoal, Emerald Night) */}
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <ThemeModeDropdown />
        </div>

        {/* Company Logo & System Name Only */}
        <div className="w-full max-w-md flex flex-col items-center text-center mb-6">
          {displayLogo ? (
            <img
              src={displayLogo}
              alt={displaySystemName}
              className="h-14 max-w-[200px] object-contain mb-2.5"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-sm mb-2.5">
              <Building2 className="w-6 h-6" />
            </div>
          )}
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            {displaySystemName}
          </h1>
        </div>

        {/* Complete White Login Box with Simple Words */}
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-lg text-slate-900">
          {step === 'LOGIN' && (
            <>
              <div className="mb-5 flex items-center justify-between gap-2">
                <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>

                {/* Single Quick Login Button with All Dummy Accounts Dropdown */}
                <div className="relative" ref={quickDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setQuickLoginOpen(prev => !prev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-orange-500" />
                    <span>Quick Login</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        quickLoginOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {quickLoginOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl py-1.5 z-50 divide-y divide-slate-100">
                      <div className="px-3.5 py-2 flex items-center justify-between bg-slate-50/70">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Dummy Accounts ({dummyAccounts.length})
                        </span>
                        <span className="text-[10px] text-slate-400">1-Click Sign In</span>
                      </div>
                      {dummyAccounts.map(account => (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => handleQuickDummyLogin(account)}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-orange-50/60 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {account.fullName}
                              </p>
                              <span className="text-[10px] font-mono text-slate-400">
                                @{account.username}
                              </span>
                            </div>
                            <p className="text-[11px] text-orange-600 font-medium truncate">
                              {account.roleName}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {account.organizationName || account.department}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${
                              account.isExternalUser
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {account.isExternalUser ? 'External' : 'Internal'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-600 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="Enter username or email"
                      className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setRecoverySent(false);
                        setStep('FORGOT');
                      }}
                      className="text-xs text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={e => setRememberDevice(e.target.checked)}
                      className="rounded border-slate-300 bg-white text-orange-500 focus:ring-orange-500"
                    />
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                >
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Need an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAccountRequestSent(false);
                    setStep('REQUEST_ACCOUNT');
                  }}
                  className="text-orange-600 hover:text-orange-700 font-semibold cursor-pointer"
                >
                  Request access
                </button>
              </div>
            </>
          )}

          {step === 'MFA' && pendingUser && (
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Verification Code</h3>
              <p className="text-xs text-slate-500 mb-5">
                Enter your 6-digit code (default: <span className="font-mono font-bold text-slate-800">482910</span>)
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-600 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleMfaSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    maxLength={10}
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl px-4 py-3 text-center text-xl font-mono font-bold tracking-[0.35em] text-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Verify</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('LOGIN');
                    setPendingUser(null);
                  }}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Back
                </button>
              </form>
            </div>
          )}

          {step === 'FORGOT' && (
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Reset Password</h3>

              {recoverySent ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    Reset Link Sent
                  </div>
                  <p>Check your email for instructions.</p>
                  <button
                    type="button"
                    onClick={() => setStep('LOGIN')}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Back to Sign in
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    securityService.logAuditEvent({
                      username: identifier || 'unknown',
                      action: 'PASSWORD_RECOVERY_REQUESTED',
                      target: `Account: ${identifier}`,
                      details: 'Password recovery requested.',
                      severity: 'Info'
                    });
                    const matched = dummyAccounts.find(
                      u =>
                        u.username.toLowerCase() === identifier.toLowerCase() ||
                        u.email.toLowerCase() === identifier.toLowerCase()
                    );
                    void centralEmailService.triggerEvent({
                      eventType: 'PASSWORD_RESET_REQUEST',
                      triggeringPortal: 'Login Page — Password Recovery',
                      triggeringAction: `Password Reset Requested for ${identifier}`,
                      targetEmails: [
                        matched?.email ||
                          (identifier.includes('@')
                            ? identifier
                            : 'stallonboost.mkt@gmail.com')
                      ],
                      variables: {
                        user_name: matched?.fullName || identifier,
                        user_email: matched?.email || identifier,
                        otp_code: '849201',
                        expiry_minutes: '15'
                      },
                      portalId: 'company-control-center'
                    });
                    setRecoverySent(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Username or Email
                    </label>
                    <input
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('LOGIN')}
                    className="w-full py-2 text-xs text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    Back
                  </button>
                </form>
              )}
            </div>
          )}

          {step === 'REQUEST_ACCOUNT' && (
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Request Access</h3>

              {accountRequestSent ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    Request Sent
                  </div>
                  <p>An administrator will review your request.</p>
                  <button
                    type="button"
                    onClick={() => setStep('LOGIN')}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Back to Sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAccountOnboardingRequest} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={reqName}
                      onChange={e => setReqName(e.target.value)}
                      placeholder="Full name"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={reqEmail}
                      onChange={e => setReqEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={reqOrg}
                      onChange={e => setReqOrg(e.target.value)}
                      placeholder="Company name"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                    <select
                      value={reqUserType}
                      onChange={e => setReqUserType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                    >
                      <option value="PROJECT_MANAGER">Project Manager</option>
                      <option value="PROJECT_ENGINEER">Project Engineer</option>
                      <option value="FACTORY_MANAGER">Factory Manager</option>
                      <option value="QA_QC_OFFICER">QA/QC Officer</option>
                      <option value="HSE_OFFICER">HSE Officer</option>
                      <option value="B2B_CLIENT">Client</option>
                      <option value="SUPPLIER">Supplier</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('LOGIN')}
                    className="w-full py-2 text-xs text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    Back
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
