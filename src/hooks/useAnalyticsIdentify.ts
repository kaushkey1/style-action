import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';
import { useAuthStore } from '@/hooks/useAuthStore';
import environment from '@/environment';

function isProduction(): boolean {
  return environment?.ENV === 'production';
}

export function trackEvent(eventName: string): void {
  if (!isProduction()) return;
  Clarity.event(eventName);
}

function getDeviceType(): string {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function useAnalyticsIdentify(): void {
  const user = useAuthStore((s) => s.user);
  const activeRoleSlug = useAuthStore((s) => s.activeRoleSlug);
  const activeWorkspace = useAuthStore((s) => s.activeWorkspace);

  useEffect(() => {
    if (!isProduction()) return;
    if (!user || !activeRoleSlug || !activeWorkspace?.orgName) return;

    Clarity.identify(user._id, undefined, undefined, `${user.firstName} ${user.lastName}`);
    Clarity.setTag('email', user.email);
    Clarity.setTag('role', activeRoleSlug);
    Clarity.setTag('org', activeWorkspace.orgName);
    Clarity.setTag('username', user.username);
    Clarity.setTag('language', navigator.language);
    Clarity.setTag('device_type', getDeviceType());
    Clarity.setTag('screen_resolution', `${window.screen.width}x${window.screen.height}`);
  }, [user, activeRoleSlug, activeWorkspace]);
}
