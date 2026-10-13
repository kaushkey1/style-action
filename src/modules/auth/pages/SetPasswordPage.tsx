import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { setPassword } from '@/modules/auth/api/authApi';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Public reset page reached from the password-reset email link
 * (`/set-password?code=...`). Sets a new password via the per-env auth API.
 */
export function SetPasswordPage(): React.ReactNode {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = (searchParams.get('code') ?? '').trim();

  const [password, setPasswordValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const validate = (): boolean => {
    const next: { password?: string; confirm?: string } = {};
    if (!password) next.password = 'Password is required';
    else if (password.length < MIN_PASSWORD_LENGTH) next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters`;
    if (confirm !== password) next.confirm = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError('');
    setIsSubmitting(true);
    try {
      const result = await setPassword(password, code);
      if (result.success) {
        setDone(true);
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setApiError(result.message || 'Unable to set your password. The link may have expired.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {!code ? (
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Invalid or expired link</h1>
            <p className="text-sm text-gray-500 mb-6">
              This password reset link is missing its code. Request a new one from the sign-in page.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : done ? (
          <div className="text-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Password updated</h1>
            <p className="text-sm text-gray-500 mb-6">
              Your password has been set. Redirecting you to sign in…
            </p>
            <Link to="/login">
              <Button className="w-full">Go to sign in</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Set a new password</h1>
            <p className="text-sm text-gray-500 mb-6">Choose a strong password for your account.</p>

            {apiError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter a new password"
                value={password}
                onChange={(e) => { setPasswordValue(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                error={errors.password}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                autoComplete="new-password"
              />
              <Input
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter the new password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })); }}
                error={errors.confirm}
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Setting…' : 'Set Password'}
              </Button>
            </form>

            <Link
              to="/login"
              className="mt-4 flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
