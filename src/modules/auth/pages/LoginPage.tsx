import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Input } from '@/components/ui';
import environment from '@/environment';
import { useAuthStore } from '@/hooks/useAuthStore';
import { trackEvent } from '@/hooks/useAnalyticsIdentify';
import { fetchSession, switchWorkspace, forgotPassword } from '@/modules/auth/api/authApi';
import { RecaptchaCheckbox } from '@/modules/auth/components/RecaptchaCheckbox';
import { isNativePlatform, enrollBiometric, isDeviceSecure } from '@/modules/auth/api/biometric';
import type { SessionResponse } from '@/modules/auth/api/authApi';
import { sharedDevelopmentLogin, startDevelopmentSession } from '@/modules/designs/sessionIntegration';

const API_BASE = environment.AUTH_API_BASE_URL;
const CONSOLE_ALLOWED_EMAIL_DOMAINS = environment.CONSOLE_ALLOWED_EMAIL_DOMAINS
  .split(',')
  .map((domain) => domain.trim().toLowerCase().replace(/^[*@.]+/, ''))
  .filter(Boolean);

type View = 'login' | 'forgot';

interface WorkspaceItem {
  urmId: string;
  orgName: string;
  roleSlug: string;
}

interface PendingUser {
  email: string;
  firstName: string;
  lastName: string;
  profilePicUrl: string | null;
}

interface LoginApiResponse {
  success: boolean;
  message: string;
  user?: PendingUser & { workspace: WorkspaceItem[] };
}

const brandMessages = [
  { title: 'AI-Powered Retail Command Center', body: 'Strategic oversight for Fashion & Lifestyle' },
  { title: 'Real-Time Business Intelligence', body: 'Visibility across your entire value chain' },
  { title: 'AI Agent Workforce', body: 'Agents that analyze, recommend, and act on your behalf' },
  { title: 'Exception-Driven Workflow', body: 'Focus only on what needs your strategic attention' },
  { title: 'Unified Planning & Execution', body: 'From AOP to store-level allocation in one platform' },
];

function getEmailDomain(email: string): string {
  return email.trim().toLowerCase().split('@')[1] ?? '';
}

function isAllowedConsoleEmail(email: string): boolean {
  if (CONSOLE_ALLOWED_EMAIL_DOMAINS.length === 0) {
    return true;
  }

  const emailDomain = getEmailDomain(email);
  return CONSOLE_ALLOWED_EMAIL_DOMAINS.some(
    (allowedDomain) =>
      emailDomain === allowedDomain || emailDomain.endsWith(`.${allowedDomain}`),
  );
}

function getEmailRestrictionMessage(): string {
  if (CONSOLE_ALLOWED_EMAIL_DOMAINS.length === 0) {
    return 'You are not authorized to sign in here.';
  }

  const domains = CONSOLE_ALLOWED_EMAIL_DOMAINS.map((domain) => `@${domain}`);
  if (domains.length === 1) {
    return `Only ${domains[0]} accounts can sign in here.`;
  }

  return `Only ${domains.slice(0, -1).join(', ')} or ${domains.at(-1)} accounts can sign in here.`;
}

/** After workspace selection, fetch full session and hydrate auth store. */
async function hydrateAuthStore(
  setSession: (user: SessionResponse['session']['passport']['user'], permissions: string[]) => void,
): Promise<boolean> {
  let sessionData;
  try {
    sessionData = sharedDevelopmentLogin
      ? await startDevelopmentSession()
      : await fetchSession();
  } catch {
    return false;
  }
  if (!sessionData) return false;

  const sessionUser = sessionData.session.passport.user;
  if (!sessionUser?.email) return false;

  setSession(sessionUser, sessionData.frontEndPermissions);

  // Auto-enroll biometric on native after successful login
  if (isNativePlatform()) {
    void isDeviceSecure().then((secure) => {
      if (secure) enrollBiometric(sessionUser);
    });
  }

  return true;
}

export function LoginPage() {
  const navigate = useNavigate();
  const finishLogin = () => navigate('/dashboard');
  const setSession = useAuthStore((s) => s.setSession);

  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(
    !environment.SKIP_AUTH || sharedDevelopmentLogin,
  );

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const captchaEnabled = Boolean(environment.RECAPTCHA_SITE_KEY);
  // Gate on the captcha only while it's genuinely available — never leave the
  // button permanently disabled if the widget can't render.
  const captchaRequired = captchaEnabled && !captchaFailed;

  // Brand carousel
  const [msgIndex, setMsgIndex] = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);

  // On mount, check if there's already a valid server session
  useEffect(() => {
    if (environment.SKIP_AUTH && !sharedDevelopmentLogin) return;

    hydrateAuthStore(setSession).then((restored) => {
      if (restored) {
        sessionStorage.removeItem('impetus-logged-out');
        finishLogin();
      }
      setIsCheckingSession(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only; setSession/navigate are stable
  }, []);

  const cycleMessage = useCallback(() => {
    setMsgVisible(false);
    const timeout = setTimeout(() => {
      setMsgIndex((prev) => (prev + 1) % brandMessages.length);
      setMsgVisible(true);
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(cycleMessage, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cycleMessage is stable via useCallback
  }, []);

  const validateLogin = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Patch workspace, fetch full session, and complete login
  const patchWorkspaceAndHydrate = async (
    urmId: string,
  ): Promise<boolean> => {
    try {
      const success = await switchWorkspace(urmId);
      if (!success) {
        setApiError('Failed to select workspace. Please try again.');
        return false;
      }

      const hydrated = await hydrateAuthStore(setSession);
      if (!hydrated) {
        setApiError('Failed to load session. Please try again.');
        return false;
      }

      sessionStorage.removeItem('impetus-logged-out');
      trackEvent('login_success');
      finishLogin();
      return true;
    } catch {
      setApiError('Unable to connect. Please try again.');
      return false;
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;

    const normalizedEmail = email.trim();
    if (!isAllowedConsoleEmail(normalizedEmail)) {
      setApiError(getEmailRestrictionMessage());
      return;
    }

    setApiError('');
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/login/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: normalizedEmail, password }),
      });
      const data: LoginApiResponse = await res.json();

      if (!data.success || !data.user) {
        // If server says user is already logged in, try to restore the existing session
        if (data.message?.toLowerCase().includes('already logged')) {
          const restored = await hydrateAuthStore(setSession);
          if (restored) {
            sessionStorage.removeItem('impetus-logged-out');
            finishLogin();
            return;
          }
        }
        setApiError(data.message || 'Invalid credentials. Please try again.');
        return;
      }

      const { user } = data;

      if (user.workspace.length > 0) {
        const preferred =
          user.workspace.find((ws) => ws.roleSlug === 'ceo') ??
          user.workspace.find((ws) => ws.roleSlug === 'org-owner') ??
          user.workspace[0]!;
        await patchWorkspaceAndHydrate(preferred.urmId);
        return;
      }

      setApiError('No workspace is configured for this account. Please contact support.');
    } catch {
      setApiError('Unable to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevelopmentLogin = async () => {
    setApiError('');
    setIsSubmitting(true);
    try {
      const data = await startDevelopmentSession(true);
      if (!data) throw new Error('Could not start the development session. Please try again.');
      setSession(data.session.passport.user, data.frontEndPermissions);
      sessionStorage.removeItem('impetus-logged-out');
      finishLogin();
    } catch (reason) {
      setApiError(reason instanceof Error ? reason.message : 'Could not start the development session.');
    } finally { setIsSubmitting(false); }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = forgotEmail.trim();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setForgotError('Enter a valid email address');
      return;
    }
    if (captchaRequired && !captchaToken) {
      setForgotError('Please complete the “I’m not a robot” check');
      return;
    }
    setForgotError('');
    setForgotSubmitting(true);
    try {
      const result = await forgotPassword(normalizedEmail, captchaToken);
      if (result.success) {
        setForgotSent(true);
      } else {
        setForgotError(result.message || 'Unable to send the reset link. Please try again.');
        // Reset the captcha — v2 tokens are single-use.
        setCaptchaToken('');
        setCaptchaResetKey((k) => k + 1);
      }
    } finally {
      setForgotSubmitting(false);
    }
  };

  if (sharedDevelopmentLogin && !isCheckingSession) {
    return <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <section className="bg-white rounded-lg border p-4 max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Impetus</h1>
        <p>Start a local development session for Impetus and Design.</p>
        {apiError && <p role="alert" className="text-red-600">{apiError}</p>}
        <Button onClick={() => { void handleDevelopmentLogin(); }} disabled={isSubmitting}>
          {isSubmitting ? 'Opening…' : 'Continue local development'}
        </Button>
      </section>
    </main>;
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <img src="/favicon.png" alt="Impetus" className="w-8 h-8 object-contain animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[3fr_7fr]">
      {/* Left — Banner Image + Text Overlay */}
      <div className="hidden lg:flex flex-col relative overflow-hidden rounded-none">
        <img
          src="/login-banner.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-left-top"
          aria-hidden="true"
        />

        {/* Top — Logo */}
        {/* eslint-disable-next-line no-restricted-syntax -- branding panel padding, not a card */}
        <div className="relative p-8">
          <img src="/impetus-logo.svg" alt="Impetus" className="h-7 w-auto" />
        </div>

        {/* Bottom — Tagline with gradient scrim */}
        <div className="relative mt-auto">
          <div
            className="absolute inset-0"
            // eslint-disable-next-line no-restricted-syntax -- gradient scrim requires inline style
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
            aria-hidden="true"
          />
          {/* eslint-disable-next-line no-restricted-syntax -- branding panel padding, not a card */}
          <div className="relative p-8 pt-16">
            <div
              className={cn(
                'transition-all duration-400',
                msgVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
              )}
            >
              <h2 className="text-lg font-semibold text-white leading-tight">
                {brandMessages[msgIndex]?.title}
              </h2>
              <p className="text-sm text-white/60 mt-2">
                {brandMessages[msgIndex]?.body}
              </p>
            </div>
            {/* Progress dots */}
            <div className="flex gap-1.5 mt-4">
              {brandMessages.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    i === msgIndex ? 'w-5 bg-white/80' : 'w-1.5 bg-white/25',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right — Form Panel */}
      <div className="flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-[400px] animate-fadeInUp">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <img src="/favicon.png" alt="Impetus" className="w-8 h-8 object-contain" />
            <span className="text-lg font-semibold text-gray-900">Impetus</span>
          </div>

          {/* Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">

            {/* -- Login view -- */}
            {view === 'login' && (
              <>
                <h1 className="text-lg font-semibold text-gray-900 mb-1">Welcome back</h1>
                <p className="text-sm text-gray-500 mb-6">Sign in to your account to continue</p>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
                    error={errors.email}
                    leftIcon={<Mail className="w-4 h-4" />}
                    autoComplete="email"
                  />

                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
                    error={errors.password}
                    leftIcon={<Lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 transition-colors focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary rounded"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    autoComplete="current-password"
                  />

                  {/* eslint-disable-next-line design-system/prefer-section-header -- login form controls row, not a section header */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      {/* eslint-disable-next-line no-restricted-syntax -- checkbox, not text input; no Checkbox primitive exists */}
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className={cn(
                          'w-4 h-4 rounded border-gray-300 text-primary',
                          'focus-kb:ring-2 focus-kb:ring-primary/20 focus-kb:ring-offset-0',
                        )}
                      />
                      <span className="text-sm text-gray-700">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setView('forgot'); setForgotSent(false); setForgotEmail(email); setForgotError(''); }}
                      className="text-sm text-primary hover:text-primary-700 transition-colors focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary rounded"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {apiError && (
                    <p className="text-sm text-error" role="alert">{apiError}</p>
                  )}

                  <Button type="submit" className="w-full" isLoading={isSubmitting}>
                    Sign In
                  </Button>
                </form>
              </>
            )}

            {/* -- Forgot password view -- */}
            {view === 'forgot' && (
              <>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary rounded"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </button>

                <h1 className="text-lg font-semibold text-gray-900 mb-1">Reset password</h1>
                <p className="text-sm text-gray-500 mb-6">
                  {forgotSent
                    ? 'Check your email for a reset link.'
                    : "Enter your email and we'll send a reset link."}
                </p>

                {!forgotSent ? (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <Input
                      label="Email"
                      type="email"
                      placeholder="you@company.com"
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                      error={forgotError}
                      leftIcon={<Mail className="w-4 h-4" />}
                      autoComplete="email"
                    />
                    <RecaptchaCheckbox
                      onChange={setCaptchaToken}
                      onError={() => setCaptchaFailed(true)}
                      resetSignal={captchaResetKey}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={forgotSubmitting || (captchaRequired && !captchaToken)}
                    >
                      {forgotSubmitting ? 'Sending…' : 'Send Reset Link'}
                    </Button>
                  </form>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setView('login')}>
                    Back to Sign In
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
