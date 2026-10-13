import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios";
import environment from "@/environment";
import { clearAllSessionData } from "@/modules/auth/api/authApi";
import { getActiveTenantId, getActiveOrgUuid } from "@/lib/utils";

axios.defaults.withCredentials = true;

// Set dev cookies on the browser domain so the proxy forwards them to the API
const DEV_COOKIES = environment.DEV_COOKIES;
if (DEV_COOKIES) {
  for (const cookie of DEV_COOKIES.split("; ")) {
    document.cookie = `${cookie}; path=/`;
  }
}

const API_BASE_URL = environment.API_BASE_URL;

// Impetus-agentic service base path — use this for OTB, inventory, ANR endpoints
export const IMPETUS_BASE = "/service/public/impetus-agentic/v1.0";

// Application-scoped base path — use for store-view, store-intelligence,
// command-center-dashboard, and insights endpoints
export const IMPETUS_APP_BASE = "/service/application/impetus-agentic/v1.0";

// Style Action endpoints already include their /v1 version segment.
export const STYLE_ACTION_BASE = "/service/public/style-action";
export const STYLE_ACTION_APP_BASE = "/service/application/style-action";

interface ApiOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  data?: unknown;
  /**
   * Opt out of the global 403 → /unauthorized redirect for this single request.
   * Use for widget-level / chrome-level endpoints (e.g. a tasks badge in the
   * top bar) where a missing permission for one role should NOT take the
   * whole app down. The request still rejects with the original error so the
   * caller can show an empty state.
   */
  skipForbiddenRedirect?: boolean;
}

export interface AxiosOptions extends ApiOptions {
  method: string;
  url: string;
  data?: unknown;
  responseType?: "blob" | "json" | "text" | "arraybuffer";
  signal?: AbortSignal;
}

export function resolveUrl(url: string): string {
  if (url.startsWith("http")) return url;
  // In dev, the Vite proxy handles impetus-agentic paths — keep them relative
  if (import.meta.env.DEV && (url.startsWith(IMPETUS_BASE) || url.startsWith(IMPETUS_APP_BASE))) return url;
  return API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, "")}${url}` : url;
}

/**
 * Build a per-request config from ApiOptions. Stashes `skipForbiddenRedirect`
 * on the config so the response interceptor can read it off `error.config`
 * and decide whether to suppress the global /unauthorized redirect.
 */
function buildConfig(options: ApiOptions): AxiosRequestConfig {
  return {
    params: options.params,
    headers: options.headers,
    // Cast: skipForbiddenRedirect is a custom flag we attach for the
    // interceptor's eyes; not part of AxiosRequestConfig's public shape.
    ...(options.skipForbiddenRedirect ? { skipForbiddenRedirect: true } as Record<string, unknown> : {}),
  };
}

export const ApiService = {
  get: (url: string, options: ApiOptions = {}): Promise<AxiosResponse> => {
    return axios.get(resolveUrl(url), buildConfig(options));
  },

  post: (url: string, options: ApiOptions = {}): Promise<AxiosResponse> => {
    return axios.post(resolveUrl(url), options.data, buildConfig(options));
  },

  put: (url: string, options: ApiOptions = {}): Promise<AxiosResponse> => {
    return axios.put(resolveUrl(url), options.data ?? {}, buildConfig(options));
  },

  patch: (url: string, options: ApiOptions = {}): Promise<AxiosResponse> => {
    return axios.patch(resolveUrl(url), options.data, buildConfig(options));
  },

  del: (url: string, options: ApiOptions = {}): Promise<AxiosResponse> => {
    return axios.delete(resolveUrl(url), buildConfig(options));
  },

  axios: (options: AxiosOptions): Promise<AxiosResponse> => {
    const config: AxiosRequestConfig = {
      method: options.method,
      url: resolveUrl(options.url),
      data: options.data,
      params: options.params,
      headers: options.headers,
      withCredentials: true,
      ...(options.skipForbiddenRedirect ? { skipForbiddenRedirect: true } as Record<string, unknown> : {}),
    };
    if (options.responseType) config.responseType = options.responseType;
    if (options.signal) config.signal = options.signal;
    return axios(config);
  },
};

const HttpStatusCodes = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
};

const UNAUTHORIZED_APP_PATH = "/unauthorized";

/** Navigate to the access-denied page (full navigation) when the API forbids the request. */
export function redirectToUnauthorizedPage(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === UNAUTHORIZED_APP_PATH) return;
  window.location.replace(UNAUTHORIZED_APP_PATH);
}

axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    // Per-call opt-out: requests made via ApiService with
    // `skipForbiddenRedirect: true` get their 403 rejected without nuking the
    // whole app. Used for widget-level endpoints in shared chrome (e.g. the
    // tasks badge in TopBar) where a missing permission for one role should
    // not redirect roles that ARE allowed to use the rest of the app.
    const skip = (error.config as { skipForbiddenRedirect?: boolean } | undefined)?.skipForbiddenRedirect;
    if (status === HttpStatusCodes.FORBIDDEN && !skip) {
      redirectToUnauthorizedPage();
      return Promise.reject(error?.response?.data ?? error);
    }
    if (status === HttpStatusCodes.UNAUTHORIZED) {
      // Clear session data via the centralized helper (preserves biometric enrollment)
      clearAllSessionData();
      sessionStorage.setItem("impetus-logged-out", "1");
      window.location.pathname = "/login";
    }
    return Promise.reject(error?.response?.data ?? error);
  },
);

// Default headers for impetus-agentic endpoints — tenant ID derived from active org
export function getImpetusHeaders(): Record<string, string> {
  return {
    "X-Tenant-ID": getActiveTenantId(),
    "X-Org-ID": getActiveOrgUuid(),
  };
}

// Backward-compatible dynamic proxy — reads tenant at access time
export const IMPETUS_HEADERS: Record<string, string> = new Proxy(
  {} as Record<string, string>,
  {
    get(_target, prop: string) {
      return getImpetusHeaders()[prop];
    },
    ownKeys() {
      return Object.keys(getImpetusHeaders());
    },
    getOwnPropertyDescriptor(_target, prop: string) {
      const headers = getImpetusHeaders();
      if (prop in headers) {
        return { configurable: true, enumerable: true, value: headers[prop] };
      }
      return undefined;
    },
  },
);

// Helper for impetus-agentic blob downloads — same headers as apiFetch, triggers browser save
export async function apiFetchBlob(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
  filename: string,
  basePath: string = IMPETUS_BASE,
): Promise<void> {
  const cleanParams: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") cleanParams[k] = v;
  }
  const res = await ApiService.axios({
    method: "GET",
    url: `${basePath}${path}`,
    params: cleanParams,
    headers: IMPETUS_HEADERS,
    responseType: "blob",
  });
  const url = URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Helper for impetus-agentic endpoints — prepends IMPETUS_BASE and unwraps envelope
export async function apiFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const cleanParams: Record<string, unknown> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        cleanParams[k] = v;
      }
    }
  }
  const res = await ApiService.get(`${IMPETUS_BASE}${path}`, {
    params: cleanParams,
    headers: IMPETUS_HEADERS,
  });
  return res.data?.data ?? res.data;
}

// Helper for application-scoped endpoints — prepends IMPETUS_APP_BASE and unwraps envelope
export async function appApiFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  opts?: { skipForbiddenRedirect?: boolean },
): Promise<T> {
  const cleanParams: Record<string, unknown> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        cleanParams[k] = v;
      }
    }
  }
  const res = await ApiService.get(`${IMPETUS_APP_BASE}${path}`, {
    params: cleanParams,
    headers: IMPETUS_HEADERS,
    skipForbiddenRedirect: opts?.skipForbiddenRedirect,
  });
  return res.data?.data ?? res.data;
}

// Helper for PUT requests — prepends IMPETUS_BASE and unwraps envelope
export async function apiPut<T>(
  path: string,
  data: unknown,
): Promise<T> {
  const res = await ApiService.put(`${IMPETUS_BASE}${path}`, {
    data,
    headers: IMPETUS_HEADERS,
  });
  return res.data?.data ?? res.data;
}

// Helper for POST requests — prepends IMPETUS_BASE and unwraps envelope
export async function apiPost<T>(
  path: string,
  data?: unknown,
): Promise<T> {
  const res = await ApiService.post(`${IMPETUS_BASE}${path}`, {
    data,
    headers: IMPETUS_HEADERS,
  });
  return res.data?.data ?? res.data;
}

// Application-scoped PUT — prepends IMPETUS_APP_BASE and unwraps envelope
export async function appApiPut<T>(
  path: string,
  data: unknown,
): Promise<T> {
  const res = await ApiService.put(`${IMPETUS_APP_BASE}${path}`, {
    data,
    headers: IMPETUS_HEADERS,
  });
  return res.data?.data ?? res.data;
}

// Application-scoped POST — prepends IMPETUS_APP_BASE and unwraps envelope
export async function appApiPost<T>(
  path: string,
  data?: unknown,
): Promise<T> {
  const res = await ApiService.post(`${IMPETUS_APP_BASE}${path}`, {
    data,
    headers: IMPETUS_HEADERS,
  });
  return res.data?.data ?? res.data;
}
