import { useEffect, useCallback, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuthStore';
import { fetchSession, clearAllSessionData } from '@/modules/auth/api/authApi';
import { sharedDevelopmentLogin, startDevelopmentSession } from '@/modules/designs/sessionIntegration';
import environment from '@/environment';
import {
  isNativePlatform,
  isBiometricEnrolled,
  getCachedUser,
  unenrollBiometric,
} from '@/modules/auth/api/biometric';
import { BiometricLock } from './BiometricLock';

import type { SessionUser } from '@/modules/auth/api/authApi';

const skipAuth = environment.SKIP_AUTH && !sharedDevelopmentLogin;

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [isCheckingSession, setIsCheckingSession] = useState(sharedDevelopmentLogin);
  const [sessionError, setSessionError] = useState('');

  // Biometric lock state — resets on every mount (every app launch)
  const needsBiometricLock = isNativePlatform() && !skipAuth && isBiometricEnrolled();
  const [biometricUnlocked, setBiometricUnlocked] = useState(!needsBiometricLock);

  const handleBiometricSuccess = useCallback((user: SessionUser) => {
    sessionStorage.removeItem('impetus-logged-out');
    setSession(user, []);
    setBiometricUnlocked(true);
  }, [setSession]);

  const handleBiometricUsePassword = useCallback(() => {
    unenrollBiometric();
    setBiometricUnlocked(true);
  }, []);

  const forceLogout = useCallback(() => {
    clearAllSessionData();
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    // Don't validate server session while the biometric lock is showing —
    // the native Face ID dialog is active and tearing down state underneath
    // it causes a crash at the native bridge level.
    if (!biometricUnlocked) return;

    if (sharedDevelopmentLogin && !isAuthenticated) {
      let cancelled = false;
      setIsCheckingSession(true);
      void startDevelopmentSession().then(data => {
        if (!cancelled && data) setSession(data.session.passport.user, data.frontEndPermissions);
      }).catch(() => {
        if (!cancelled) setSessionError('Could not start the development login. Allow browser storage and reload.');
      }).finally(() => { if (!cancelled) setIsCheckingSession(false); });
      return () => { cancelled = true; };
    }

    // skipAuth auto-login: only if user hasn't explicitly logged out
    if (skipAuth && !isAuthenticated) {
      const didManualLogout = sessionStorage.getItem("impetus-logged-out");
      if (!didManualLogout) {
        // For SKIP_AUTH mode, create a mock session user
        setSession(
          {
            _id: 'demo',
            email: 'demo@impetus.com',
            username: 'demo',
            firstName: 'Demo',
            lastName: 'User',
            timezone: 'Asia/Kolkata',
            emailVerified: true,
            active: true,
            profilePicUrl: undefined,
            workspace: [
              {
                urmId: 'demo-urm',
                orgId: 1,
                orgName: 'Reliance Retail',
                orgConfig: { timezone: 'Asia/Kolkata' },
                roleId: 1,
                roleSlug: 'business-head',
                inviteMap: [],
                account: [],
                accountLeafNodes: [],
                userHubIds: [],
              },
            ],
            selectedUrmId: 'demo-urm',
            orgId: 1,
            roleSlug: 'business-head',
          },
          [],
        );
      }
      return;
    }

    if (!skipAuth && !isAuthenticated) {
      setIsCheckingSession(false);
      return;
    }

    if (!skipAuth && isAuthenticated) {
      let cancelled = false;
      let intervalId: number | undefined;

      const checkSession = async (showLoader = false) => {
        if (showLoader && !cancelled) {
          setIsCheckingSession(true);
        }

        let sessionData;
        try {
          sessionData = sharedDevelopmentLogin && showLoader
            ? await startDevelopmentSession()
            : await fetchSession();
        }
        catch {
          // Keep the current screen during a network outage; do not invent a logout.
          if (!cancelled) setIsCheckingSession(false);
          return true;
        }

        if (cancelled) return false;

        if (showLoader) {
          setIsCheckingSession(false);
        }

        if (!sessionData) {
          forceLogout();
          return false;
        }

        // Hydrate auth store with latest session data
        const sessionUser = sessionData.session.passport.user;
        setSession(sessionUser, sessionData.frontEndPermissions);
        return true;
      };

      void checkSession(true).then((shouldContinue) => {
        if (!shouldContinue || cancelled) return;

        intervalId = window.setInterval(() => {
          void checkSession(false);
        }, 60_000);
      });

      return () => {
        cancelled = true;
        if (intervalId !== undefined) {
          window.clearInterval(intervalId);
        }
      };
    }

    setIsCheckingSession(false);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- skipAuth is module constant, setSession/clearSession/forceLogout are stable Zustand actions, biometricUnlocked gates the effect
  }, [isAuthenticated, biometricUnlocked]);

  // Biometric gate — show lock screen before any content on native
  if (!biometricUnlocked && needsBiometricLock) {
    const cachedUser = getCachedUser();
    if (cachedUser) {
      return (
        <BiometricLock
          onSuccess={handleBiometricSuccess}
          onUsePassword={handleBiometricUsePassword}
        />
      );
    }
  }

  if (sessionError) return <div role="alert" className="p-4">{sessionError}</div>;
  if (sharedDevelopmentLogin && !isAuthenticated && isCheckingSession)
    return <div className="p-4">Opening Impetus…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!skipAuth && isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-sm text-white/80">Loading...</div>
    );
  }
  return <>{children}</>;
}
