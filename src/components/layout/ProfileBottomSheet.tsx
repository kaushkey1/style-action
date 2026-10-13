import { sharedDevelopmentLogin } from '@/modules/designs/sessionIntegration';
import { useToast } from '@/hooks/useToast';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Layers, LogOut, Check, Fingerprint, HeadphonesIcon } from "lucide-react";
import { BottomSheet, Switch } from "@/components/ui";
import { useNavigationStore } from "@/hooks/useNavigationStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { trackEvent } from "@/hooks/useAnalyticsIdentify";
import { cn } from "@/lib/utils";
import {
  isNativePlatform,
  isBiometricEnrolled,
  enrollBiometric,
  unenrollBiometric,
  setPreferDeviceCredential,
  prefersDeviceCredential,
} from "@/modules/auth/api/biometric";
import { getExternalUrl } from "@/data/navigationConfig";

/** Format role slug for display: "business-head" → "Business Head". */
function formatRoleSlug(slug: string): string {
  if (slug === "ceo") return "CEO";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ProfileBottomSheet() {
  const navigate = useNavigate();
  const { isProfileSheetOpen, setProfileSheetOpen } = useNavigationStore();
  const user = useAuthStore((s) => s.user);
  const organizations = useAuthStore((s) => s.organizations);
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const activeRoleSlug = useAuthStore((s) => s.activeRoleSlug);
  const availableRoles = useAuthStore((s) => s.availableRoles);
  const isSwitching = useAuthStore((s) => s.isSwitching);
  const switchOrganization = useAuthStore((s) => s.switchOrganization);
  const switchRole = useAuthStore((s) => s.switchRole);
  const logout = useAuthStore((s) => s.logout);
  const { error: showLogoutError } = useToast();
  const isNative = isNativePlatform();
  const [isBiometricOn, setIsBiometricOn] = useState(() => isBiometricEnrolled() && !prefersDeviceCredential());

  const handleBiometricToggle = (checked: boolean) => {
    setIsBiometricOn(checked);
    if (checked) {
      setPreferDeviceCredential(false);
      if (!isBiometricEnrolled() && user) {
        enrollBiometric(user);
      }
    } else {
      setPreferDeviceCredential(true);
    }
  };

  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "??";

  const activeOrg = organizations.find((o) => o.orgId === activeOrgId);

  const handleOrgSwitch = async (orgId: number) => {
    if (orgId === activeOrgId || isSwitching) return;
    trackEvent('org_switch');
    const success = await switchOrganization(orgId);
    if (success) {
      window.location.reload();
    }
  };

  const handleRoleSwitch = async (roleSlug: string) => {
    if (roleSlug === activeRoleSlug || isSwitching) return;
    trackEvent(`role_switch_${roleSlug}`);
    const success = await switchRole(roleSlug);
    if (success) {
      setProfileSheetOpen(false);
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    trackEvent('logout');
    if (sharedDevelopmentLogin) {
      try { await logout(); }
      catch { showLogoutError('Could not sign out everywhere. Please try again.'); return; }
      unenrollBiometric();
    } else {
      unenrollBiometric();
      logout();
    }
    setProfileSheetOpen(false);
    navigate("/login");
  };

  return (
    <BottomSheet
      isOpen={isProfileSheetOpen}
      onClose={() => setProfileSheetOpen(false)}
      maxHeight="70vh"
    >
      {/* User info */}
      <div className="flex items-center gap-3 pb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-primary">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {user ? `${user.firstName} ${user.lastName}` : "--"}
          </p>
          <p className="text-xs text-gray-500 truncate">{user?.email ?? ""}</p>
        </div>
      </div>

      <div className="h-px bg-gray-100 -mx-4" />

      {/* Organization switcher — mirrors desktop: interactive list when >1, read-only label when ≤1 */}
      <div className="py-2 -mx-4">
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3 h-3" />
            Organizations
          </p>
        </div>
        {organizations.length > 1 ? (
          organizations.map((org) => {
            const isActive = org.orgId === activeOrgId;
            return (
              <button
                key={org.orgId}
                onClick={() => handleOrgSwitch(org.orgId)}
                disabled={isSwitching}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 text-left text-sm min-h-12",
                  isActive
                    ? "text-primary bg-primary/5 font-medium"
                    : "text-gray-700 hover:bg-gray-50 active:bg-gray-100",
                  isSwitching && "opacity-50 cursor-wait",
                )}
              >
                <span className="flex-1 truncate">{org.orgName}</span>
                {isActive && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>
            );
          })
        ) : (
          <div className="px-4 py-3 text-sm text-gray-500 min-h-12 flex items-center">
            {activeOrg?.orgName ?? '—'}
          </div>
        )}
      </div>

      <div className="h-px bg-gray-100 -mx-4" />

      {/* Role switcher — mirrors desktop: interactive list when >1, read-only label when ≤1 */}
      <div className="py-2 -mx-4">
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3 h-3" />
            Roles
          </p>
        </div>
        {availableRoles.length > 1 ? (
          <div className="max-h-64 overflow-y-auto">
            {availableRoles.map((role) => {
              const isActive = role.roleSlug === activeRoleSlug;
              return (
                <button
                  key={role.urmId}
                  onClick={() => handleRoleSwitch(role.roleSlug)}
                  disabled={isSwitching}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 text-left text-sm min-h-12",
                    isActive
                      ? "text-primary bg-primary/5 font-medium"
                      : "text-gray-700 hover:bg-gray-50 active:bg-gray-100",
                    isSwitching && "opacity-50 cursor-wait",
                  )}
                >
                  <span className="flex-1">
                    {formatRoleSlug(role.roleSlug)}
                  </span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-3 text-sm text-gray-500 min-h-12 flex items-center">
            {activeRoleSlug ? formatRoleSlug(activeRoleSlug) : 'Role'}
          </div>
        )}
      </div>

      <div className="h-px bg-gray-100 -mx-4" />

      {/* Biometric toggle — native only */}
      {isNative && (
        <>
          <div className="py-2 -mx-4">
            {/* eslint-disable-next-line design-system/prefer-section-header -- toggle row, not a section header */}
            <div className="flex items-center justify-between px-4 py-3 min-h-12">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-700">Biometric Login</p>
                  <p className="text-xs text-gray-400">Face ID / Fingerprint</p>
                </div>
              </div>
              <Switch
                checked={isBiometricOn}
                onCheckedChange={handleBiometricToggle}
                aria-label="Toggle biometric login"
              />
            </div>
          </div>
          <div className="h-px bg-gray-100 -mx-4" />
        </>
      )}

      {/* Support */}
      <div className="py-2 -mx-4">
        <button
          onClick={() => { window.open(getExternalUrl('instadesk') ?? '#', '_blank'); }}
          className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 min-h-12"
        >
          <HeadphonesIcon className="w-4 h-4 text-gray-400" />
          Support
        </button>
      </div>

      <div className="h-px bg-gray-100 -mx-4" />

      {/* Logout */}
      <div className="py-2 -mx-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 active:bg-red-100 min-h-12"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </BottomSheet>
  );
}

