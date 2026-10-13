import environment from '@/environment';
import { sharedDevelopmentLogin, readDesignSession, signOutOfSharedSession, DEVELOPMENT_LOGOUT_KEY } from '@/modules/designs/sessionIntegration';

const AUTH_API_BASE_URL = environment.AUTH_API_BASE_URL;
const SESSION_URL = AUTH_API_BASE_URL.replace(/\/authentication\/?$/, '/session');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Workspace {
  urmId: string;
  orgId: number;
  orgName: string;
  orgConfig: {
    timezone: string;
    companyCode?: string;
    currencyCode?: string;
  };
  roleId: number;
  roleSlug: string;
  inviteMap: unknown[];
  account: unknown[];
  accountLeafNodes: unknown[];
  userHubIds: unknown[];
}

export interface SessionUser {
  _id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicUrl?: string;
  timezone: string;
  emailVerified: boolean;
  active: boolean;
  workspace: Workspace[];
  selectedUrmId?: string;
  roleIds?: number[];
  orgId?: number;
  roleSlug?: string;
}

export interface SessionResponse {
  success: boolean;
  message: string;
  session: {
    passport: {
      user: SessionUser;
    };
  };
  frontEndPermissions: string[];
  requestId: string;
}

export interface Organization {
  orgId: number;
  orgName: string;
  orgConfig: { timezone: string; companyCode?: string; currencyCode?: string };
}

export interface WorkspaceRole {
  roleId: number;
  roleSlug: string;
  urmId: string;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function fetchSession(): Promise<SessionResponse | null> {
  try {
    if (sharedDevelopmentLogin) return await readDesignSession();
    const res = await fetch(`${SESSION_URL}?_=${Date.now()}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const data: unknown = await res.json();
    const parsed = data as SessionResponse;

    if (!parsed.success) return null;
    if (!parsed.session?.passport?.user?.email) return null;

    return parsed;
  } catch {
    return null;
  }
}

export async function switchWorkspace(
  urmId: string,
): Promise<boolean> {
  try {
    const res = await fetch(
      `${AUTH_API_BASE_URL}/login/workspace/${urmId}`,
      { method: 'PATCH', credentials: 'include' },
    );
    const data = (await res.json()) as { success: boolean };
    return data.success;
  } catch {
    return false;
  }
}

export function logoutApi(): void | Promise<void> {
  if (sharedDevelopmentLogin) return signOutOfSharedSession();
  try {
    fetch(`${AUTH_API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      /* ignore */
    });
  } catch {
    // ignore
  }
}

export interface AuthActionResult {
  success: boolean;
  message: string;
}

/**
 * Request a password-reset email. `captchaCode` is a reCAPTCHA token (may be an
 * empty string when captcha is not configured for the environment).
 * Uses the per-env `AUTH_API_BASE_URL` — never a hardcoded domain.
 */
export async function forgotPassword(
  email: string,
  captchaCode: string,
): Promise<AuthActionResult> {
  try {
    const res = await fetch(`${AUTH_API_BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, captchaCode }),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<AuthActionResult>;
    return {
      success: res.ok && data.success !== false,
      message: data.message ?? (res.ok ? '' : 'Unable to send the reset link. Please try again.'),
    };
  } catch {
    return { success: false, message: 'Unable to connect. Please try again.' };
  }
}

/** Set a new password using the reset `code` from the emailed link. */
export async function setPassword(
  password: string,
  code: string,
): Promise<AuthActionResult> {
  try {
    const res = await fetch(`${AUTH_API_BASE_URL}/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password, code }),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<AuthActionResult>;
    return {
      success: res.ok && data.success !== false,
      message: data.message ?? (res.ok ? '' : 'Unable to set your password. The link may have expired.'),
    };
  } catch {
    return { success: false, message: 'Unable to connect. Please try again.' };
  }
}

/** Keys that must survive session clears — biometric enrollment persists across logouts
 *  so the user can re-authenticate with Face ID / fingerprint on next launch. */
const BIOMETRIC_PRESERVE_KEYS = [
  'impetus-biometric-enabled',
  'impetus-biometric-user',
  'impetus-biometric-prefer-pin',
] as const;

export function clearAllSessionData(): void {
  const developmentLogout = sharedDevelopmentLogin && localStorage.getItem(DEVELOPMENT_LOGOUT_KEY);
  // Save biometric enrollment before wiping localStorage
  const preserved = BIOMETRIC_PRESERVE_KEYS.map(
    (key) => [key, localStorage.getItem(key)] as const,
  );

  sessionStorage.clear();
  localStorage.clear();
  if (developmentLogout) localStorage.setItem(DEVELOPMENT_LOGOUT_KEY, developmentLogout);

  // Restore biometric enrollment so Face ID / fingerprint works on next launch
  for (const [key, value] of preserved) {
    if (value !== null) localStorage.setItem(key, value);
  }

  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0]?.trim();
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${environment.SESSION_COOKIE_DOMAIN}`;
    }
  });
}

// ---------------------------------------------------------------------------
// Derivation helpers
// ---------------------------------------------------------------------------

/** Derive unique organizations from a workspace list. */
export function deriveOrganizations(workspaces: Workspace[]): Organization[] {
  const seen = new Set<number>();
  const orgs: Organization[] = [];
  for (const ws of workspaces) {
    if (!seen.has(ws.orgId)) {
      seen.add(ws.orgId);
      orgs.push({
        orgId: ws.orgId,
        orgName: ws.orgName,
        orgConfig: ws.orgConfig,
      });
    }
  }
  return orgs;
}

/** Derive available roles for a given orgId, sorted by roleId ascending. */
export function deriveRolesForOrg(
  workspaces: Workspace[],
  orgId: number,
): WorkspaceRole[] {
  return workspaces
    .filter((ws) => ws.orgId === orgId)
    .sort((a, b) => a.roleId - b.roleId)
    .map((ws) => ({
      roleId: ws.roleId,
      roleSlug: ws.roleSlug,
      urmId: ws.urmId,
    }));
}
