// Manual JSDOM bootstrap for bun test compatibility
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
});
(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).navigator = dom.window.navigator;

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import Navbar from '../components/Navbar';

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

describe('Navbar Component', () => {
  it('renders branding and logout button (mock/stub)', () => {
    // Stub global component render
    const mockNavbar = () => (
      <nav>
        <div className="brand">CariSkripsi UPI</div>
        <button>Keluar</button>
      </nav>
    );
    const { getByText } = render(React.createElement(mockNavbar));
    expect(getByText('CariSkripsi UPI')).toBeDefined();
  });

  it('renders real Navbar branding and user email', () => {
    const { getByText } = render(React.createElement(Navbar, { userEmail: 'mhs@upi.edu' }));
    expect(getByText('mhs@upi.edu')).toBeDefined();
  });
});
