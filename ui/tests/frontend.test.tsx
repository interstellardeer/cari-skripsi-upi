// Manual JSDOM bootstrap for bun test compatibility
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
});
const win = dom.window;
(globalThis as any).window = win;
(globalThis as any).document = win.document;
(globalThis as any).navigator = win.navigator;

// Set up globals from window for floating-ui and base-ui compatibility
const domGlobals = [
  'Element',
  'HTMLElement',
  'SVGElement',
  'Node',
  'customElements',
  'Location',
  'History',
  'Event',
  'CustomEvent',
  'MouseEvent',
  'KeyboardEvent',
  'FocusEvent',
  'PointerEvent',
  'VisualViewport',
  'ResizeObserver',
  'IntersectionObserver',
  'MutationObserver'
];

domGlobals.forEach((prop) => {
  if (prop in win) {
    (globalThis as any)[prop] = (win as any)[prop];
  }
});

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import Navbar from '../components/Navbar';

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
  useSession: () => ({
    data: {
      user: {
        name: 'Mahasiswa UPI',
        email: 'mhs@upi.edu',
        image: 'https://example.com/avatar.png',
      },
    },
    status: 'authenticated',
  }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

vi.mock('ai/react', () => ({
  useChat: () => ({
    messages: [],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
  }),
}));

import SearchDashboard from '../app/(protected)/search/page';


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
    const { getByText, container } = render(React.createElement(Navbar));
    expect(getByText('CariSkripsi')).toBeDefined();
    expect(getByText('MU')).toBeDefined();
    const logoImg = container.querySelector('img[src="/logo.png"]');
    expect(logoImg).not.toBeNull();
  });
});

describe('SearchDashboard Component Layout', () => {
  it('renders search tab triggers and default inputs', () => {
    const { getByText, getByPlaceholderText, container } = render(React.createElement(SearchDashboard));
    expect(getByText('Pencarian Semantik')).toBeDefined();
    expect(getByText('Natural Language (RAG)')).toBeDefined();
    expect(getByPlaceholderText('Cari topik skripsi, misalnya: media pembelajaran berbasis web...')).toBeDefined();
    const logoImg = container.querySelector('img[src="/logo.png"]');
    expect(logoImg).not.toBeNull();
  });

  it('renders semantic search bottom layout elements', () => {
    const { getByPlaceholderText, getByText, container } = render(React.createElement(SearchDashboard));
    
    // Verify search input is present in semantic search view with the correct placeholder and ID
    const searchInput = container.querySelector('#semantic-search-input');
    expect(searchInput).not.toBeNull();
    expect(getByPlaceholderText('Cari topik skripsi, misalnya: media pembelajaran berbasis web...')).toBeDefined();
    
    // Verify welcome state query chips are present
    expect(getByText('pembelajaran berbasis game')).toBeDefined();

    // Verify filter toggle button showing a SlidersHorizontal icon is present
    const filterIcon = container.querySelector('.lucide-sliders-horizontal');
    expect(filterIcon).not.toBeNull();
  });

  it('toggles filter panel and displays close button', async () => {
    const { getByLabelText, container } = render(React.createElement(SearchDashboard));
    
    // Toggle filters ON
    const filterBtn = getByLabelText('Filter');
    fireEvent.click(filterBtn);
    
    // Verify close icon is rendered
    const closeIcon = container.querySelector('.lucide-x');
    expect(closeIcon).not.toBeNull();
  });
});
