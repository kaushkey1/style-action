import { useEffect, useState, useCallback } from 'react';
import { Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui';
import { authenticateBiometric, getCachedUser, prefersDeviceCredential } from '@/modules/auth/api/biometric';

import type { SessionUser } from '@/modules/auth/api/authApi';

interface BiometricLockProps {
  /** Called when biometric/PIN authentication succeeds with the cached user */
  onSuccess: (user: SessionUser) => void;
  /** Called when the user chooses to use password login instead */
  onUsePassword: () => void;
}

/**
 * Full-screen lock overlay that triggers native biometric/PIN authentication.
 * Auto-triggers on mount. Shows retry and password fallback on failure.
 *
 * @param onSuccess - Callback with cached SessionUser on successful authentication
 * @param onUsePassword - Callback when user chooses password login fallback
 *
 * @example
 * <BiometricLock
 *   onSuccess={(user) => login(user)}
 *   onUsePassword={() => navigate('/login')}
 * />
 */
export function BiometricLock({ onSuccess, onUsePassword }: BiometricLockProps): React.ReactNode {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const handleAuthenticate = useCallback(async () => {
    setIsAuthenticating(true);
    setHasFailed(false);

    // Use device credential (PIN) only when user has disabled biometric in settings
    const success = await authenticateBiometric(prefersDeviceCredential());

    if (success) {
      const cachedUser = getCachedUser();
      if (cachedUser) {
        onSuccess(cachedUser);
        return;
      }
      // Cached user missing — fall through to password
      onUsePassword();
      return;
    }

    setIsAuthenticating(false);
    setHasFailed(true);
  }, [onSuccess, onUsePassword]);

  // Auto-trigger biometric on mount
  useEffect(() => {
    void handleAuthenticate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: handleAuthenticate is stable via useCallback
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 pt-safe pb-safe px-4">
      {/* App branding */}
      <div className="flex items-center gap-3 mb-8">
        <img src="/favicon.png" alt="Impetus" className="w-10 h-10 object-contain" />
        <span className="text-xl font-semibold text-gray-900">Impetus</span>
      </div>

      {/* Lock icon */}
      <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-6">
        <Fingerprint className="w-8 h-8 text-primary-600" />
      </div>

      {/* Status text */}
      <p className="text-sm text-gray-600 text-center mb-8">
        {isAuthenticating
          ? 'Verifying your identity...'
          : hasFailed
            ? 'Authentication failed. Please try again.'
            : 'Unlock to continue'}
      </p>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full max-w-[280px]">
        {hasFailed && (
          <Button
            onClick={() => void handleAuthenticate()}
            className="w-full"
            disabled={isAuthenticating}
          >
            Try Again
          </Button>
        )}

        <Button
          variant="outline"
          onClick={onUsePassword}
          className="w-full"
          disabled={isAuthenticating}
        >
          Use Password
        </Button>
      </div>
    </div>
  );
}
