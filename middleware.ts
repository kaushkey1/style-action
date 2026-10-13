export const config = {
  matcher: '/(.*)',
};

export default function middleware(req: Request) {
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue || '').split(':');

    const expectedUser = process.env.BASIC_AUTH_USER || 'admin';
    const expectedPwd = process.env.BASIC_AUTH_PASSWORD || 'password';

    if (user === expectedUser && pwd === expectedPwd) {
      return;
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
