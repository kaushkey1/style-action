import { describe, it, expect, vi, beforeEach } from 'vitest';
import { forgotPassword, setPassword } from '@/modules/auth/api/authApi';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

function resp(ok: boolean, body: unknown) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) });
}

function lastCall() {
  const call = fetchMock.mock.calls.at(-1);
  const url = String(call?.[0] ?? '');
  const init = (call?.[1] ?? {}) as RequestInit;
  const body = JSON.parse((init.body as string) ?? '{}') as Record<string, unknown>;
  return { url, init, body };
}

describe('forgotPassword', () => {
  it('POSTs {email, captchaCode} to the env AUTH base /forgot-password', async () => {
    fetchMock.mockReturnValue(resp(true, { success: true, message: 'sent' }));
    const res = await forgotPassword('sudarshans@gofynd.com', 'captcha-token');
    expect(res.success).toBe(true);
    const { url, init, body } = lastCall();
    expect(url).toMatch(/\/authentication\/forgot-password$/);
    expect(init.method).toBe('POST');
    expect(body).toEqual({ email: 'sudarshans@gofynd.com', captchaCode: 'captcha-token' });
  });

  it('surfaces a backend failure message', async () => {
    fetchMock.mockReturnValue(resp(false, { success: false, message: 'Invalid captcha' }));
    const res = await forgotPassword('a@b.com', '');
    expect(res.success).toBe(false);
    expect(res.message).toBe('Invalid captcha');
  });
});

describe('setPassword', () => {
  it('POSTs {password, code} to the env AUTH base /set-password', async () => {
    fetchMock.mockReturnValue(resp(true, { success: true }));
    const res = await setPassword('Sudarshan@123$', '7d39ddb6-c414-4087-b229-e9e28702987e');
    expect(res.success).toBe(true);
    const { url, body } = lastCall();
    expect(url).toMatch(/\/authentication\/set-password$/);
    expect(body).toEqual({ password: 'Sudarshan@123$', code: '7d39ddb6-c414-4087-b229-e9e28702987e' });
  });
});
