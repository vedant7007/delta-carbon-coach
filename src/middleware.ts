import { NextResponse, type NextRequest } from 'next/server';

/**
 * Security headers + a strict, nonce-based Content-Security-Policy.
 *
 * The nonce is generated per-request and propagated to Next.js via the
 * `x-nonce` request header; Next applies it to its framework scripts
 * automatically when it sees the nonce in the request CSP header.
 *
 * style-src allows 'unsafe-inline' because Recharts and some Radix primitives
 * set inline style attributes; script execution is locked down by nonce.
 */
export function middleware(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Firebase Auth/Firestore endpoints the client must reach.
  const firebase = [
    'https://*.googleapis.com',
    'https://*.google.com',
    'https://apis.google.com',
    'https://*.gstatic.com',
    'https://securetoken.googleapis.com',
    'https://identitytoolkit.googleapis.com',
  ].join(' ');

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://apis.google.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https://*.googleusercontent.com https://*.gstatic.com`,
    `font-src 'self'`,
    `connect-src 'self' ${firebase}`,
    `frame-src 'self' https://*.firebaseapp.com https://accounts.google.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set('content-security-policy', csp);
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'permissions-policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  );
  response.headers.set(
    'strict-transport-security',
    'max-age=63072000; includeSubDomains; preload',
  );

  return response;
}

export const config = {
  // Apply to all routes except static assets and image optimisation.
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
