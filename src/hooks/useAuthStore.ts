import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import environment from '@/environment';
import { setFormattingConfig } from '@/lib/utils';
import {
  fetchSession,
  switchWorkspace,
  logoutApi,
  clearAllSessionData,
  deriveOrganizations,
  deriveRolesForOrg,
} from '@/modules/auth/api/authApi';
import type {
  SessionUser,
  Workspace,
  Organization,
  WorkspaceRole,
} from '@/modules/auth/api/authApi';

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

interface AuthState {
  // Session state
  user: SessionUser | null;
  frontEndPermissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionChecked: boolean;
  isSwitching: boolean;

  // Organization & role state (derived from workspaces)
  organizations: Organization[];
  activeOrgId: number | null;
  activeRoleSlug: string | null;
  activeWorkspace: Workspace | null;
  availableRoles: WorkspaceRole[];

  // Resolved tenant info (from screen config API)
  tenantId: string | null;
  resolvedOrgId: string | null;
  locale: string;
  currency: string;

  // Actions
  setSession: (user: SessionUser, permissions: string[]) => void;
  switchOrganization: (orgId: number) => Promise<boolean>;
  switchRole: (roleSlug: string) => Promise<boolean>;
  setTenantInfo: (tenantId: string, orgId: string, locale?: string, currency?: string) => void;
  clearSession: () => void;
  logout: () => void | Promise<void>;
  setLoading: (loading: boolean) => void;
  setSessionChecked: (checked: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findWorkspace(
  workspaces: Workspace[],
  orgId: number,
  roleSlug: string,
): Workspace | null {
  return (
    workspaces.find(
      (ws) => ws.orgId === orgId && ws.roleSlug === roleSlug,
    ) ?? null
  );
}

const INITIAL_STATE = {
  user: null,
  frontEndPermissions: [] as string[],
  isAuthenticated: false,
  isLoading: false,
  sessionChecked: false,
  isSwitching: false,
  organizations: [] as Organization[],
  activeOrgId: null,
  activeRoleSlug: null,
  activeWorkspace: null,
  availableRoles: [] as WorkspaceRole[],
  tenantId: null,
  resolvedOrgId: null,
  locale: 'en-IN',
  currency: 'INR',
} as const;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setSession: (user, permissions) => {
        const organizations = deriveOrganizations(user.workspace);
        const validOrgIds = new Set(user.workspace.map((ws) => ws.orgId));
        const persistedOrgId = get().activeOrgId;
        const activeOrgId =
          persistedOrgId !== null && validOrgIds.has(persistedOrgId)
            ? persistedOrgId
            : (user.orgId ?? user.workspace[0]?.orgId ?? null);
        const persistedRoleSlug = get().activeRoleSlug;
        const roleExistsForOrg =
          persistedRoleSlug !== null &&
          activeOrgId !== null &&
          user.workspace.some(
            (ws) =>
              ws.orgId === activeOrgId && ws.roleSlug === persistedRoleSlug,
          );
        const activeRoleSlug = roleExistsForOrg
          ? persistedRoleSlug
          : (user.workspace.find((ws) => ws.orgId === activeOrgId && ws.roleSlug === 'planning-super-admin')?.roleSlug ??
          user.roleSlug ??
          user.workspace.find((ws) => ws.roleSlug === 'ceo')?.roleSlug ??
          user.workspace.find((ws) => ws.roleSlug === 'org-owner')?.roleSlug ??
          user.workspace[0]?.roleSlug ??
          null);
        const availableRoles =
          activeOrgId !== null
            ? deriveRolesForOrg(user.workspace, activeOrgId)
            : [];
        const activeWorkspace =
          activeOrgId !== null && activeRoleSlug !== null
            ? findWorkspace(user.workspace, activeOrgId, activeRoleSlug)
            : null;

        set({
          user,
          frontEndPermissions: permissions,
          isAuthenticated: true,
          isLoading: false,
          sessionChecked: true,
          organizations,
          activeOrgId,
          activeRoleSlug,
          activeWorkspace,
          availableRoles,
        });
      },

      switchOrganization: async (orgId) => {
        let { user, activeRoleSlug } = get();

        if (!user) {
          const sessionData = await fetchSession();
          if (!sessionData) return false;
          const sessionUser = sessionData.session.passport.user;
          get().setSession(sessionUser, sessionData.frontEndPermissions);
          user = sessionUser;
          activeRoleSlug = get().activeRoleSlug;
        }

        if (!user) return false;

        set({ isSwitching: true });

        // Determine role for new org: preserve current if available, else first
        const rolesInNewOrg = deriveRolesForOrg(user.workspace, orgId);
        const matchingRole = rolesInNewOrg.find(
          (r) => r.roleSlug === activeRoleSlug,
        );
        const targetRoleSlug = matchingRole
          ? activeRoleSlug
          : (rolesInNewOrg[0]?.roleSlug ?? null);

        if (!targetRoleSlug) {
          set({ isSwitching: false });
          return false;
        }

        const targetWorkspace = findWorkspace(
          user.workspace,
          orgId,
          targetRoleSlug,
        );
        if (!targetWorkspace) {
          set({ isSwitching: false });
          return false;
        }

        // Dev short-circuit: SKIP_AUTH has no backend, so apply the org/role
        // change locally and re-derive availableRoles from the mock workspace.
        if (environment.SKIP_AUTH) {
          set({
            activeOrgId: orgId,
            activeRoleSlug: targetRoleSlug,
            activeWorkspace: targetWorkspace,
            availableRoles: deriveRolesForOrg(user.workspace, orgId),
            isSwitching: false,
          });
          return true;
        }

        const success = await switchWorkspace(targetWorkspace.urmId);
        if (!success) {
          set({ isSwitching: false });
          return false;
        }

        // Re-fetch session to get updated frontEndPermissions
        const sessionData = await fetchSession();
        if (!sessionData) {
          set({ isSwitching: false });
          return false;
        }

        const sessionUser = sessionData.session.passport.user;
        const organizations = deriveOrganizations(sessionUser.workspace);
        const newOrgId = sessionUser.orgId ?? orgId;
        const newRoleSlug = sessionUser.roleSlug ?? targetRoleSlug;
        const availableRoles = deriveRolesForOrg(
          sessionUser.workspace,
          newOrgId,
        );
        const activeWorkspace = findWorkspace(
          sessionUser.workspace,
          newOrgId,
          newRoleSlug,
        );

        set({
          user: sessionUser,
          frontEndPermissions: sessionData.frontEndPermissions,
          organizations,
          activeOrgId: newOrgId,
          activeRoleSlug: newRoleSlug,
          activeWorkspace,
          availableRoles,
          isSwitching: false,
        });

        return true;
      },

      switchRole: async (roleSlug) => {
        let { user, activeOrgId } = get();

        // User may not be hydrated in sessionStorage (partialize excludes it).
        // Re-fetch the session to get the workspace list before switching.
        if (!user) {
          const sessionData = await fetchSession();
          if (!sessionData) return false;
          const sessionUser = sessionData.session.passport.user;
          get().setSession(sessionUser, sessionData.frontEndPermissions);
          user = sessionUser;
          activeOrgId = get().activeOrgId;
        }

        if (!user || activeOrgId === null) return false;

        set({ isSwitching: true });

        const targetWorkspace = findWorkspace(
          user.workspace,
          activeOrgId,
          roleSlug,
        );
        if (!targetWorkspace) {
          set({ isSwitching: false });
          return false;
        }

        // Dev short-circuit: SKIP_AUTH has no backend — apply the role
        // change locally without re-fetching the session.
        if (environment.SKIP_AUTH) {
          set({
            activeRoleSlug: roleSlug,
            activeWorkspace: targetWorkspace,
            isSwitching: false,
          });
          return true;
        }

        const success = await switchWorkspace(targetWorkspace.urmId);
        if (!success) {
          set({ isSwitching: false });
          return false;
        }

        const sessionData = await fetchSession();
        if (!sessionData) {
          set({ isSwitching: false });
          return false;
        }

        const sessionUser = sessionData.session.passport.user;
        const newRoleSlug = sessionUser.roleSlug ?? roleSlug;
        const availableRoles = deriveRolesForOrg(
          sessionUser.workspace,
          activeOrgId,
        );
        const activeWorkspace = findWorkspace(
          sessionUser.workspace,
          activeOrgId,
          newRoleSlug,
        );

        set({
          user: sessionUser,
          frontEndPermissions: sessionData.frontEndPermissions,
          activeRoleSlug: newRoleSlug,
          activeWorkspace,
          availableRoles,
          isSwitching: false,
        });

        return true;
      },

      clearSession: () => {
        set({ ...INITIAL_STATE });
      },

      logout: () => {
        const finishLogout = () => {
          clearAllSessionData();
          sessionStorage.setItem('impetus-logged-out', '1');
          set({ ...INITIAL_STATE });
        };
        const pending = logoutApi();
        if (pending) return pending.then(finishLogout);
        // Preserve the original synchronous logout when Design integration is off.
        return finishLogout();
      },

      setTenantInfo: (tenantId, orgId, locale, currency) => set({
        tenantId,
        resolvedOrgId: orgId,
        ...(locale && { locale }),
        ...(currency && { currency }),
      }),
      setLoading: (loading) => set({ isLoading: loading }),
      setSessionChecked: (checked) => set({ sessionChecked: checked }),
    }),
    {
      name: 'impetus-auth',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) =>
          sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
      partialize: (state) =>
        ({
          isAuthenticated: state.isAuthenticated,
          frontEndPermissions: state.frontEndPermissions,
          activeOrgId: state.activeOrgId,
          activeRoleSlug: state.activeRoleSlug,
          tenantId: state.tenantId,
          resolvedOrgId: state.resolvedOrgId,
          locale: state.locale,
          currency: state.currency,
        }) as unknown as AuthState,
      onRehydrateStorage: () => (state) => {
        if (state) {
          setFormattingConfig(state.locale, state.currency);
        }
      },
    },
  ),
);
