import { describe, it, expect } from 'vitest';
import { authOptions } from '../lib/auth';

describe('NextAuth Configuration callbacks', () => {
  it('should accept Google OAuth accounts with @upi.edu emails', async () => {
    const signIn = authOptions.callbacks?.signIn;
    if (typeof signIn === 'function') {
      const allowed = await signIn({
        user: { id: 'user-1', email: 'mahasiswa@upi.edu' },
        account: { provider: 'google' } as any,
        profile: { email: 'mahasiswa@upi.edu' } as any,
      });
      expect(allowed).toBe(true);
    } else {
      throw new Error('signIn callback is undefined');
    }
  });

  it('should accept Google OAuth accounts with uppercase @UPI.EDU emails', async () => {
    const signIn = authOptions.callbacks?.signIn;
    if (typeof signIn === 'function') {
      const allowed = await signIn({
        user: { id: 'user-3', email: 'mahasiswa@UPI.EDU' },
        account: { provider: 'google' } as any,
        profile: { email: 'mahasiswa@UPI.EDU' } as any,
      });
      expect(allowed).toBe(true);
    } else {
      throw new Error('signIn callback is undefined');
    }
  });

  it('should deny Google OAuth accounts with generic Gmail addresses', async () => {
    const signIn = authOptions.callbacks?.signIn;
    if (typeof signIn === 'function') {
      const allowed = await signIn({
        user: { id: 'user-2', email: 'spammer@gmail.com' },
        account: { provider: 'google' } as any,
        profile: { email: 'spammer@gmail.com' } as any,
      });
      expect(allowed).toBe(false);
    } else {
      throw new Error('signIn callback is undefined');
    }
  });
});
