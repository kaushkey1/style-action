'use strict';

const DEFAULT_API_PROXY_TARGET = 'https://api.impetusz0.de';
const DEFAULT_API_BASE_URL = 'https://api.impetusz0.de';
const DEFAULT_SESSION_COOKIE_DOMAIN = '.impetusz0.de';
const DEFAULT_TENANT_ID = 'fnl';
const DEFAULT_ORG_ID = '5331f8af-b091-cb9f-e2a4-d247f2acaf16';
const DEFAULT_CONSOLE_ALLOWED_EMAIL_DOMAINS = 'gofynd.com,ril.com,fynd-external.com';
const DEFAULT_STYLE_BANK_API_BASE_URL =
  'https://api.create.sit.fyndx1.de/service/public/create-costing-agent/api/design/style-bank/reliance-brands';
const DEFAULT_USE_MOCK_DATA = 'false';
const DEFAULT_USE_BIGQUERY = 'false';
const DEFAULT_BIGQUERY_PROJECT = 'fynd-jio-impetus-prod';

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function resolveApiProxyTarget(env = process.env) {
  return trimTrailingSlash(env.API_PROXY_TARGET || DEFAULT_API_PROXY_TARGET);
}

function resolveAuthApiBaseUrl(env = process.env, apiProxyTarget) {
  return trimTrailingSlash(
    env.AUTH_API_BASE_URL ||
      `${apiProxyTarget}/sentinel/service/panel/users/v1.0/authentication`
  );
}

function getBrowserConfig(env = process.env) {
  const apiProxyTarget = resolveApiProxyTarget(env);

  return {
    ENV: env.ENV || env.NODE_ENV || 'development',
    DESIGN_APP_URL: env.DESIGN_APP_URL || (env.ENV === 'local' ? '/design-app/designs' : ''),
    API_BASE_URL: 'API_BASE_URL' in env && env.API_BASE_URL !== undefined
      ? env.API_BASE_URL
      : DEFAULT_API_BASE_URL,
    AUTH_API_BASE_URL: resolveAuthApiBaseUrl(env, apiProxyTarget),
    SESSION_COOKIE_DOMAIN:
      env.SESSION_COOKIE_DOMAIN || DEFAULT_SESSION_COOKIE_DOMAIN,
    DEV_COOKIES: env.DEV_COOKIES || '',
    TENANT_ID: env.TENANT_ID || DEFAULT_TENANT_ID,
    ORG_ID: env.ORG_ID || DEFAULT_ORG_ID,
    CONSOLE_ALLOWED_EMAIL_DOMAINS:
      env.CONSOLE_ALLOWED_EMAIL_DOMAINS ||
      DEFAULT_CONSOLE_ALLOWED_EMAIL_DOMAINS,
    SKIP_AUTH:
      env.SKIP_AUTH === 'true' || env.VITE_SKIP_AUTH === 'true'
        ? 'true'
        : 'false',
    STYLE_BANK_API_BASE_URL:
      env.STYLE_BANK_API_BASE_URL || DEFAULT_STYLE_BANK_API_BASE_URL,
    USE_MOCK_DATA:
      env.USE_MOCK_DATA || env.VITE_USE_MOCK_DATA || DEFAULT_USE_MOCK_DATA,
    USE_BIGQUERY:
      env.USE_BIGQUERY || env.VITE_USE_BIGQUERY || DEFAULT_USE_BIGQUERY,
    BIGQUERY_PROJECT:
      env.BIGQUERY_PROJECT ||
      env.VITE_BIGQUERY_PROJECT ||
      DEFAULT_BIGQUERY_PROJECT,
    RECAPTCHA_SITE_KEY:
      env.RECAPTCHA_SITE_KEY || env.VITE_RECAPTCHA_SITE_KEY || '',
    // Only present when explicitly configured — otherwise the frontend uses
    // its built-in default (the gbrain backend URL) from src/environment.ts.
    ...(env.GBRAIN_API_BASE_URL || env.VITE_GBRAIN_API_BASE_URL
      ? {
          GBRAIN_API_BASE_URL:
            env.GBRAIN_API_BASE_URL || env.VITE_GBRAIN_API_BASE_URL,
        }
      : {}),
  };
}

function get(env = process.env) {
  return {
    PORT: Number(env.PORT || 80),
    API_PROXY_TARGET: resolveApiProxyTarget(env),
    BROWSER_CONFIG: getBrowserConfig(env),
  };
}

module.exports = {
  get,
  getBrowserConfig,
};
