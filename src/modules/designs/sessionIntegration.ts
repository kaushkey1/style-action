/** Local Demo User only. Deployed authentication belongs to the gateway. */
import environment from '@/environment';
import type { SessionResponse } from '@/modules/auth/api/authApi';

export const DEVELOPMENT_SESSION_KEY = 'impetus-development-session';
export const DEVELOPMENT_LOGOUT_KEY = 'impetus-development-logged-out';
export const sharedDevelopmentLogin = import.meta.env.DEV
  && environment.ENV === 'local' && environment.SKIP_AUTH
  && Boolean(environment.DESIGN_APP_URL)
  && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

export async function startDevelopmentSession(explicit = false): Promise<SessionResponse | null> {
  if (!sharedDevelopmentLogin) throw new Error('Development login is not enabled.');
  const current = await readDesignSession();
  if (current) return current;
  if (!explicit && (localStorage.getItem(DEVELOPMENT_LOGOUT_KEY) || sessionStorage.getItem('impetus-logged-out'))) return null;
  const payload: SessionResponse = {
    success: true, message: '', requestId: 'local-development', frontEndPermissions: [],
    session: { passport: { user: {
      _id: 'impetus-local-developer', email: 'demo@impetus.com', username: 'demo',
      firstName: 'Demo', lastName: 'User', timezone: 'Asia/Kolkata',
      active: true, emailVerified: true, selectedUrmId: 'demo-urm', orgId: 1,
      roleSlug: 'business-head', workspace: [{
        urmId: 'demo-urm', orgId: 1, orgName: 'Reliance Retail',
        orgConfig: { timezone: 'Asia/Kolkata' }, roleId: 1, roleSlug: 'business-head',
        inviteMap: [], account: [], accountLeafNodes: [], userHubIds: [],
      }],
    } } },
  };
  localStorage.removeItem(DEVELOPMENT_LOGOUT_KEY);
  localStorage.setItem(DEVELOPMENT_SESSION_KEY, JSON.stringify(payload));
  return payload;
}

export async function readDesignSession(): Promise<SessionResponse | null> {
  if (!sharedDevelopmentLogin) throw new Error('Development login is not enabled.');
  if (localStorage.getItem(DEVELOPMENT_LOGOUT_KEY)) return null;
  const stored = localStorage.getItem(DEVELOPMENT_SESSION_KEY);
  if (!stored) return null;
  const payload = JSON.parse(stored) as SessionResponse;
  return payload?.success && payload.session?.passport?.user?._id ? payload : null;
}

export async function signOutOfSharedSession(): Promise<void> {
  if (!sharedDevelopmentLogin) throw new Error('Development login is not enabled.');
  localStorage.setItem(DEVELOPMENT_LOGOUT_KEY, 'true');
  localStorage.removeItem(DEVELOPMENT_SESSION_KEY);
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('impetus-session') : null;
  channel?.postMessage('signed-out');
  channel?.close();
}
