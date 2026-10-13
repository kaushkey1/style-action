interface WindowConfig {
  ENV?: string;
  API_BASE_URL?: string;
  AUTH_API_BASE_URL?: string;
  SESSION_COOKIE_DOMAIN?: string;
  DEV_COOKIES?: string;
  TENANT_ID?: string;
  ORG_ID?: string;
  CONSOLE_ALLOWED_EMAIL_DOMAINS?: string;
  SKIP_AUTH?: string;
  USE_MOCK_DATA?: string;
  STYLE_BANK_API_BASE_URL?: string;
  USE_BIGQUERY?: string;
  BIGQUERY_PROJECT?: string;
  CLARITY_PROJECT_ID?: string;
  GBRAIN_API_BASE_URL?: string;
  RECAPTCHA_SITE_KEY?: string;
  [key: string]: unknown;
}

interface EnvironmentConfig {
  DESIGN_APP_URL: string;
  ENV: string;
  API_BASE_URL: string;
  AUTH_API_BASE_URL: string;
  SESSION_COOKIE_DOMAIN: string;
  DEV_COOKIES: string;
  TENANT_ID: string;
  ORG_ID: string;
  CONSOLE_ALLOWED_EMAIL_DOMAINS: string;
  SKIP_AUTH: boolean;
  USE_MOCK_DATA: boolean;
  STYLE_BANK_API_BASE_URL: string;
  USE_BIGQUERY: boolean;
  BIGQUERY_PROJECT: string;
  CLARITY_PROJECT_ID: string;
  GBRAIN_API_BASE_URL: string;
  /** Google reCAPTCHA v2 ("I'm not a robot") site key. Empty ⇒ captcha widget hidden. */
  RECAPTCHA_SITE_KEY: string;
}

declare global {
  interface Window {
    _conf?: WindowConfig;
  }
}

const browserConfig =
  typeof window !== 'undefined' && window._conf ? window._conf : {};

function readString(
  value: unknown,
  fallback: string,
): string {
  return typeof value === 'string' && value.length > 0
    ? value
    : fallback;
}

const environment: EnvironmentConfig = {
  DESIGN_APP_URL: readString(browserConfig.DESIGN_APP_URL, ''),
  ENV: readString(browserConfig.ENV, 'development'),
  API_BASE_URL: readString(browserConfig.API_BASE_URL, 'https://api.jioimpetus.com/sentinel'),
  // NOTE: /sentinel is the API-gateway prefix (as in SIT/UAT). Deployed app calls go through it;
  // local dev sets API_BASE_URL='' and uses the Vite proxy → localhost:8000 (sentinel bypassed).
  AUTH_API_BASE_URL: readString(
    browserConfig.AUTH_API_BASE_URL,
    'https://api.impetusz0.de/sentinel/service/panel/users/v1.0/authentication',
  ),
  SESSION_COOKIE_DOMAIN: readString(
    browserConfig.SESSION_COOKIE_DOMAIN,
    '.impetusz0.de',
  ),
  DEV_COOKIES: readString(browserConfig.DEV_COOKIES, ''),
  TENANT_ID: readString(browserConfig.TENANT_ID, 'fnl'),
  ORG_ID: readString(browserConfig.ORG_ID, '5331f8af-b091-cb9f-e2a4-d247f2acaf16'),
  CONSOLE_ALLOWED_EMAIL_DOMAINS: readString(
    browserConfig.CONSOLE_ALLOWED_EMAIL_DOMAINS,
    'gofynd.com,ril.com,fynd-external.com',
  ),
  SKIP_AUTH: browserConfig.SKIP_AUTH === 'true',
  USE_MOCK_DATA:
    browserConfig.USE_MOCK_DATA !== undefined
      ? browserConfig.USE_MOCK_DATA === 'true'
      : false,
  STYLE_BANK_API_BASE_URL: readString(
    browserConfig.STYLE_BANK_API_BASE_URL,
    'https://api.create.sit.fyndx1.de/service/public/create-costing-agent/api/design/style-bank/reliance-brands',
  ),
  USE_BIGQUERY:
    browserConfig.USE_BIGQUERY !== undefined
      ? browserConfig.USE_BIGQUERY === 'true'
      : false,
  BIGQUERY_PROJECT: readString(
    browserConfig.BIGQUERY_PROJECT,
    'fynd-jio-impetus-prod'
  ),
  CLARITY_PROJECT_ID: readString(
    browserConfig.CLARITY_PROJECT_ID,
    'wfjpckvzup'
  ),
  GBRAIN_API_BASE_URL: readString(
    browserConfig.GBRAIN_API_BASE_URL,
    'https://api.create.sit.fyndx1.de/service/public/create-costing-agent',
  ),
  // reCAPTCHA v2 site key baked as the default so captcha works without per-env injection.
  // Override per environment by setting a non-empty RECAPTCHA_SITE_KEY (config.cjs / env-config).
  // NOTE: reCAPTCHA is domain-restricted — this key must have every serving domain (e.g.
  // console.impetusz0.de) added in the Google reCAPTCHA admin, and be paired with the auth
  // backend's reCAPTCHA secret, or the widget shows "Invalid domain for site key".
  RECAPTCHA_SITE_KEY: readString(
    browserConfig.RECAPTCHA_SITE_KEY,
    '6LfBL4gkAAAAAJdxnNtTjohgksQ_AD9AIiUSkQBR',
  ),
};

/** Check if the app is running in mock/demo mode (no backend APIs) */
export function isMockMode(): boolean {
  return environment.USE_MOCK_DATA || !environment.USE_BIGQUERY;
}

/** Check if BigQuery is enabled */
export function isBigQueryEnabled(): boolean {
  return environment.USE_BIGQUERY && !environment.USE_MOCK_DATA;
}

export default environment;
