import { Capacitor } from '@capacitor/core';

import type { SessionUser } from '@/modules/auth/api/authApi';

// Lazy-loaded biometric plugin — only imported on native platforms to avoid
// crashes when the native plugin isn't registered (e.g. on web builds)
let biometricModule: typeof import('@aparajita/capacitor-biometric-auth') | null = null;

async function getBiometricPlugin(): Promise<typeof import('@aparajita/capacitor-biometric-auth') | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (biometricModule) return biometricModule;
  try {
    biometricModule = await import('@aparajita/capacitor-biometric-auth');
    return biometricModule;
  } catch {
    return null;
  }
}

interface CheckBiometryResult { isAvailable: boolean; deviceIsSecure?: boolean }

const STORAGE_KEYS = {
  ENROLLED: 'impetus-biometric-enabled',
  CACHED_USER: 'impetus-biometric-user',
  PREFER_DEVICE_CREDENTIAL: 'impetus-biometric-prefer-pin',
} as const;

/**
 * Returns true if the app is running inside a native Capacitor shell (iOS/Android).
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Checks whether the device supports biometric auth or has a device credential (PIN/passcode).
 * Returns the full biometry result for detailed checks.
 */
export async function checkBiometry(): Promise<CheckBiometryResult | null> {
  const plugin = await getBiometricPlugin();
  if (!plugin) return null;

  try {
    return await plugin.BiometricAuth.checkBiometry();
  } catch {
    return null;
  }
}

/**
 * Returns true if biometric hardware is available and enrolled,
 * OR if the device at least has a secure credential (PIN/passcode).
 */
export async function isDeviceSecure(): Promise<boolean> {
  const result = await checkBiometry();
  if (!result) return false;
  return result.isAvailable || result.deviceIsSecure || false;
}

/**
 * Triggers the native biometric or device-credential authentication prompt.
 *
 * @param useDeviceCredential - When true, allows device PIN/passcode fallback
 *   (used when the user has disabled biometric in the app).
 *   When false (default), only biometric (Face ID / fingerprint) is shown.
 */
export async function authenticateBiometric(useDeviceCredential = false): Promise<boolean> {
  const plugin = await getBiometricPlugin();
  if (!plugin) return false;

  // Verify biometry is available before attempting — some native plugins crash
  // if authenticate() is called without first checking availability.
  try {
    await plugin.BiometricAuth.checkBiometry();
  } catch {
    return false;
  }

  try {
    await plugin.BiometricAuth.authenticate({
      reason: 'Unlock Impetus Command Center',
      allowDeviceCredential: useDeviceCredential,
      cancelTitle: 'Cancel',
      androidTitle: 'Unlock Impetus',
      androidSubtitle: 'Verify your identity to continue',
    });
    return true;
  } catch (error: unknown) {
    const biometryError = error as { code?: string | number };
    if (biometryError.code === String(plugin.BiometryErrorType.userCancel)) {
      return false;
    }
    if (biometryError.code === String(plugin.BiometryErrorType.passcodeNotSet)) {
      return false;
    }
    return false;
  }
}

/**
 * Enrolls biometric auth by caching the user data and setting the enrollment flag.
 * Called automatically after a successful password login on native.
 */
export function enrollBiometric(user: SessionUser): void {
  localStorage.setItem(STORAGE_KEYS.ENROLLED, 'true');
  localStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(user));
}

/**
 * Clears biometric enrollment and cached user data.
 * Called on logout.
 */
export function unenrollBiometric(): void {
  localStorage.removeItem(STORAGE_KEYS.ENROLLED);
  localStorage.removeItem(STORAGE_KEYS.CACHED_USER);
  localStorage.removeItem(STORAGE_KEYS.PREFER_DEVICE_CREDENTIAL);
}

/**
 * Returns true if the user has previously enrolled in biometric auth.
 * Synchronous — reads from localStorage.
 */
export function isBiometricEnrolled(): boolean {
  return localStorage.getItem(STORAGE_KEYS.ENROLLED) === 'true';
}

/**
 * Returns the cached SessionUser from localStorage, or null if not available.
 */
export function getCachedUser(): SessionUser | null {
  const data = localStorage.getItem(STORAGE_KEYS.CACHED_USER);
  if (!data) return null;

  try {
    const parsed: unknown = JSON.parse(data);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'email' in parsed &&
      'firstName' in parsed
    ) {
      return parsed as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns true if the user prefers device PIN/passcode over biometric.
 */
export function prefersDeviceCredential(): boolean {
  return localStorage.getItem(STORAGE_KEYS.PREFER_DEVICE_CREDENTIAL) === 'true';
}

/**
 * Sets preference for device credential (PIN) over biometric.
 */
export function setPreferDeviceCredential(prefer: boolean): void {
  if (prefer) {
    localStorage.setItem(STORAGE_KEYS.PREFER_DEVICE_CREDENTIAL, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.PREFER_DEVICE_CREDENTIAL);
  }
}
