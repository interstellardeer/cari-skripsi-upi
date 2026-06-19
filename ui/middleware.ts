import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { checkRateLimit } from './lib/rate-limit';
import { getToken } from 'next-auth/jwt';

export default withAuth(
  async function middleware(req) {
    const path = req.nextUrl.pathname;

    if (path.startsWith('/api/search') || path.startsWith('/api/chat')) {
      const token = await getToken({ req });
      const userKey = token?.email || (req as any).ip || 'anonymous';
      const limitType = path.startsWith('/api/search') ? 'search' : 'chat';

      try {
        const { success } = await checkRateLimit(userKey, limitType);
        if (!success) {
          return NextResponse.json(
            { error: 'Too Many Requests. Rate limit exceeded.' },
            { status: 429 }
          );
        }
      } catch (err) {
        console.error('Rate limit error, bypassing limit checks:', err);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/search/:path*', '/api/search/:path*', '/api/chat/:path*'],
};
