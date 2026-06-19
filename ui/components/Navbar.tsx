'use client';

import { signOut } from 'next-auth/react';

interface NavbarProps {
  userEmail?: string;
}

export default function Navbar({ userEmail }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        CariSkripsi <span>UPI</span>
      </div>
      <div className="nav-user">
        <span className="user-email">{userEmail}</span>
        <button className="btn btn-secondary btn-sm" onClick={() => signOut()}>
          Keluar
        </button>
      </div>
    </nav>
  );
}
